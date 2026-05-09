// Content script for Interpark waiting page - NOL Noti

console.log('[NOL Noti] Content script loaded');

(function() {
  if (window.__nolNotiInjected) return;
  window.__nolNotiInjected = true;

  let lastQueueInfo = null;
  let sentQueueNumbers = new Set();
  let monitoring = false;
  let panelElement = null;
  let queueLog = [];
  let lastQueueNumber = null;
  let lastLogTime = null;
  let lastLogNumber = null;
  let enabled = true;
  let currentLang = 'zh-CN';
  let thresholdNotificationCount = 0;
  const MAX_THRESHOLD_NOTIFICATIONS = 3;
  const RATE_PER_MINUTE = 100;
  
  const translations = {
    'zh-CN': { wait: '等候人数', rate: '订购率', threshold: '阈值', sound: '声音', etaBase: '基础:', etaDynamic: '动态:', notifyThreshold: '目前排队号码为({n})，请留意NOL页面', notifyTurn: '已到排队顺位({n})，请留意', notifyBooking: '已进入NOL购票页面，请在10分钟内完成购票', waiting: '等待中', queueLabel: '排队号码', etaLabel: '预计进入', lblWait: '等候人数', lblRate: '订购率', bookingCountdown: '购票剩余' },
    'zh-TW': { wait: '等候人數', rate: '訂購率', threshold: '閾值', sound: '聲音', etaBase: '基礎:', etaDynamic: '動態:', notifyThreshold: '目前排隊號碼為({n})，請留意NOL頁面', notifyTurn: '已到排隊順位({n})，請留意', notifyBooking: '已進入NOL購票頁面，請在10分鐘內完成購票', waiting: '等待中', queueLabel: '排隊號碼', etaLabel: '預計進入', lblWait: '等候人數', lblRate: '訂購率', bookingCountdown: '購票剩餘' },
    'en': { wait: 'Est. Wait', rate: 'Booking', threshold: 'Threshold', sound: 'Sound', etaBase: 'Base:', etaDynamic: 'Dynamic:', notifyThreshold: 'Current queue: {n}, check NOL page', notifyTurn: 'It\'s your turn({n}), please proceed', notifyBooking: 'Entered NOL booking page, please complete purchase within 10 minutes', waiting: 'Waiting', queueLabel: 'Queue No.', etaLabel: 'Est. Time', lblWait: 'Est. Wait', lblRate: 'Booking', bookingCountdown: 'Time Left' }
  };
  
  let countdownInterval = null;
  let bookingStartTime = null;
  
  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    bookingStartTime = Date.now();
    
    const etaLabelEl = panelElement?.querySelector('.nol-noti-eta-label');
    const etaEl = panelElement?.querySelector('#nol-eta');
    const t = translations[currentLang];
    
    if (etaLabelEl) {
      etaLabelEl.textContent = t.bookingCountdown;
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    if (!bookingStartTime) return;
    
    const elapsed = Date.now() - bookingStartTime;
    const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    const etaEl = panelElement?.querySelector('#nol-eta');
    if (etaEl) {
      etaEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      etaEl.style.color = '#EF4444';
      etaEl.style.fontWeight = '700';
    }
    
    if (remaining <= 0) {
      clearInterval(countdownInterval);
    }
  }
  
  function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    const langLabel = { 'zh-CN': '简', 'zh-TW': '繁', 'en': 'EN' };
    
    const langEl = panelElement?.querySelector('#nol-lang');
    if (langEl) langEl.textContent = langLabel[lang];
    
    panelElement?.querySelectorAll('.lbl-wait').forEach(el => el.textContent = t.wait);
    panelElement?.querySelectorAll('.lbl-rate').forEach(el => el.textContent = t.rate);
    panelElement?.querySelectorAll('.lbl-threshold').forEach(el => el.textContent = t.threshold);
    panelElement?.querySelectorAll('.lbl-sound').forEach(el => el.textContent = t.sound);
    
    panelElement?.querySelectorAll('.nol-noti-queue-label').forEach(el => el.textContent = t.queueLabel);
    panelElement?.querySelectorAll('.nol-noti-eta-label').forEach(el => {
      el.textContent = bookingStartTime ? t.bookingCountdown : t.etaLabel;
    });
  }
  
  function toggleLanguage() {
    const langs = ['zh-CN', 'zh-TW', 'en'];
    const idx = langs.indexOf(currentLang);
    const next = langs[(idx + 1) % langs.length];
    setLanguage(next);
    chrome.storage.local.set({ language: next });
  }
  
  // Calculate estimated time based on actual decrease rate
  function calculateDynamicETA(currentNumber) {
    if (queueLog.length < 2) return null;
    
    let totalDecrease = 0;
    let totalMinutes = 0;
    
    // queueLog[0] is newest (smallest number), queueLog[last] is oldest (largest)
    for (let i = 0; i < queueLog.length - 1; i++) {
      const newer = queueLog[i];      // newer entry, smaller number
      const older = queueLog[i + 1];  // older entry, larger number
      
      const timeDiff = parseTimeDiff(newer.time, older.time);
      if (timeDiff > 0) {
        // actual decrease = older - newer (larger - smaller)
        const decrease = older.number - newer.number;
        if (decrease > 0) {
          totalDecrease += decrease;
          totalMinutes += timeDiff;
        }
      }
    }
    
    if (totalMinutes < 0.1 || totalDecrease <= 0) return null;
    
    const ratePerMinute = totalDecrease / totalMinutes;
    if (ratePerMinute < 0.1) return null;
    
    const minutes = currentNumber / ratePerMinute;
    return { minutes, rate: ratePerMinute };
  }
  
  function parseTimeDiff(time1, time2) {
    // time format: HH:MM:SS
    // time1 is newer (smaller queue number), time2 is older (larger queue number)
    const parse = (t) => {
      const [h, m, s] = t.split(':').map(Number);
      return h * 3600 + m * 60 + (s || 0);
    };
    // time difference in seconds
    return (parse(time1) - parse(time2)) / 60; // convert to minutes
  }

  // Create floating panel
  function createPanel() {
    if (panelElement) return;
    
    panelElement = document.createElement('div');
    panelElement.id = 'nol-noti-panel';
    panelElement.innerHTML = `
      <div class="nol-noti-header">
        <span class="nol-noti-title">NOL Noti <span style="font-size:9px;opacity:0.5;font-weight:normal;">by Syj.</span></span>
        <span class="nol-noti-lang" id="nol-lang">简</span>
      </div>
      <div class="nol-noti-main">
        <div class="nol-noti-queue">
          <div class="nol-noti-queue-label">排队号码</div>
          <div class="nol-noti-queue-number">-</div>
        </div>
        <div class="nol-noti-eta-box">
          <div class="nol-noti-eta-label">预计进入</div>
          <div class="nol-noti-eta-time" id="nol-eta">等待中</div>
        </div>
      </div>
      <div class="nol-noti-stats">
        <div class="nol-noti-stat">
          <span class="nol-noti-stat-label lbl-wait">等候人数</span>
          <span class="nol-noti-stat-value" id="nol-wait">-</span>
        </div>
        <div class="nol-noti-stat">
          <span class="nol-noti-stat-label lbl-rate">订购率</span>
          <span class="nol-noti-stat-value" id="nol-rate">-</span>
        </div>
      </div>
      <div class="nol-noti-log" id="nol-log"></div>
      <div class="nol-noti-settings">
        <div class="nol-noti-setting-row">
          <span class="lbl-threshold">阈值</span>
          <input type="number" id="nol-threshold" value="1000" min="0">
        </div>
        <div class="nol-noti-setting-row">
          <span>Bark</span>
          <input type="text" id="nol-bark" placeholder="Webhook URL">
        </div>
        <div class="nol-noti-setting-row">
          <span class="lbl-sound">声音</span>
          <label class="nol-noti-toggle">
            <input type="checkbox" id="nol-sound" checked>
            <span class="nol-noti-slider"></span>
          </label>
        </div>
        <button class="nol-noti-test" id="nol-stop-sound" style="display:none;">停止声音</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #nol-noti-panel {
        position: fixed;
        top: 100px;
        right: 20px;
        left: auto;
        width: 310px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(37, 99, 235, 0.08), 0 1px 2px rgba(0,0,0,0.04);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        border: 1px solid #E2E8F0;
      }
      .nol-noti-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
        color: #fff;
        border-radius: 16px 16px 0 0;
        cursor: move;
        user-select: none;
      }
      .nol-noti-title { font-weight: 600; font-size: 15px; letter-spacing: 0.5px; }
      .nol-noti-lang { 
        font-size: 11px; cursor: pointer; padding: 3px 8px; 
        background: rgba(255,255,255,0.15); border-radius: 12px; font-weight: 500;
        margin-left: 8px;
      }
      .nol-noti-close { background: none; border: none; color: rgba(255,255,255,0.7); font-size: 16px; cursor: pointer; padding: 0; }
      .nol-noti-close:hover { color: #fff; }
      .nol-noti-main { padding: 20px 16px; text-align: center; }
      .nol-noti-queue { margin-bottom: 16px; }
      .nol-noti-queue-label { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
      .nol-noti-queue-number { font-size: 42px; font-weight: 700; color: #1E40AF; line-height: 1; }
      .nol-noti-eta-box { background: #EFF6FF; border-radius: 10px; padding: 12px; margin-bottom: 16px; border: 1px solid #DBEAFE; }
      .nol-noti-eta-label { font-size: 10px; color: #60A5FA; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .nol-noti-eta-time { font-size: 18px; font-weight: 600; color: #2563EB; }
      .nol-noti-stats { display: flex; gap: 12px; padding: 0 16px; margin-bottom: 12px; }
      .nol-noti-stat { flex: 1; background: #F8FAFC; border-radius: 10px; padding: 10px; text-align: center; border: 1px solid #F1F5F9; }
      .nol-noti-stat-label { display: block; font-size: 10px; color: #94A3B8; margin-bottom: 4px; }
      .nol-noti-stat-value { font-size: 16px; font-weight: 600; color: #334155; }
      .nol-noti-log { max-height: 100px; overflow-y: auto; padding: 0 16px; border-top: 1px solid #F1F5F9; }
      .nol-noti-log-entry { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F8FAFC; font-size: 11px; }
      .nol-noti-log-time { color: #CBD5E1; }
      .nol-noti-log-num { color: #3B82F6; font-weight: 500; }
      .nol-noti-log-num.down { color: #10B981; }
      .nol-noti-settings { padding: 12px 16px; background: #F8FAFC; border-top: 1px solid #F1F5F9; border-radius: 0 0 16px 16px; }
      .nol-noti-setting-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; }
      .nol-noti-setting-row:last-child { margin-bottom: 0; }
      .nol-noti-setting-row > span:first-child { color: #64748B; min-width: 28px; }
      .nol-noti-setting-row input[type="number"], .nol-noti-setting-row input[type="text"] { flex: 1; padding: 6px 10px; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 12px; background: #fff; }
      .nol-noti-setting-row input:focus { outline: none; border-color: #3B82F6; }
      .nol-noti-toggle { position: relative; width: 36px; height: 20px; margin-left: auto; }
      .nol-noti-toggle input { display: none; }
      .nol-noti-slider { position: absolute; cursor: pointer; inset: 0; background: #CBD5E1; border-radius: 20px; transition: 0.3s; }
      .nol-noti-slider:before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
      .nol-noti-toggle input:checked + .nol-noti-slider { background: #3B82F6; }
      .nol-noti-toggle input:checked + .nol-noti-slider:before { transform: translateX(16px); }
      .nol-noti-test { width: 100%; padding: 10px; margin-top: 8px; background: #EF4444; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(panelElement);
    
    panelElement.querySelector('#nol-lang').addEventListener('click', toggleLanguage);
    
    // Drag functionality
    const header = panelElement.querySelector('.nol-noti-header');
    let isDragging = false, startX, startY, startLeft, startTop;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = panelElement.offsetLeft;
      startTop = panelElement.offsetTop;
      header.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panelElement.style.left = (startLeft + e.clientX - startX) + 'px';
      panelElement.style.top = (startTop + e.clientY - startY) + 'px';
      panelElement.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) { isDragging = false; header.style.cursor = 'move'; }
    });
    
    loadSettings();
    
    panelElement.querySelector('#nol-threshold').addEventListener('change', async (e) => {
      await chrome.storage.local.set({ threshold: parseInt(e.target.value) || 1000 });
    });
    
    panelElement.querySelector('#nol-bark').addEventListener('change', async (e) => {
      await chrome.storage.local.set({ barkWebhook: e.target.value.trim() });
    });
    
    panelElement.querySelector('#nol-sound').addEventListener('change', async (e) => {
      await chrome.storage.local.set({ soundEnabled: e.target.checked });
    });
    
    
    
    panelElement.querySelector('#nol-stop-sound').addEventListener('click', () => {
      if (window.alertInterval) {
        clearInterval(window.alertInterval);
        window.alertInterval = null;
      }
      const stopBtn = panelElement.querySelector('#nol-stop-sound');
      if (stopBtn) stopBtn.style.display = 'none';
    });
  }
  
  async function loadSettings() {
    const result = await chrome.storage.local.get(['threshold', 'barkWebhook', 'soundEnabled', 'pluginEnabled', 'language']);
    const thresholdEl = panelElement?.querySelector('#nol-threshold');
    const barkEl = panelElement?.querySelector('#nol-bark');
    const soundEl = panelElement?.querySelector('#nol-sound');
    
    if (thresholdEl) thresholdEl.value = result.threshold || 1000;
    if (barkEl) barkEl.value = result.barkWebhook || '';
    if (soundEl) soundEl.checked = result.soundEnabled !== false;
    
    enabled = result.pluginEnabled !== false;
    
    if (result.language) {
      setLanguage(result.language);
    }
  }

  function updatePanel(info) {
    if (!panelElement) return;
    if (panelElement.style.display === 'none') panelElement.style.display = 'block';
    
    const numberEl = panelElement.querySelector('.nol-noti-queue-number');
    const waitEl = panelElement.querySelector('#nol-wait');
    const rateEl = panelElement.querySelector('#nol-rate');
    const etaEl = panelElement.querySelector('#nol-eta');
    const logEl = panelElement.querySelector('#nol-log');
    
    if (numberEl) numberEl.textContent = info.queueNumber.toLocaleString();
    
    if (waitEl) {
      waitEl.textContent = info.estimatedWait ? info.estimatedWait.toLocaleString() : '-';
    }
    
    if (rateEl && info.bookingRate) {
      rateEl.textContent = info.bookingRate + '%';
    }
    
    const t = translations[currentLang];
    
    if (etaEl) {
      const formatTime = (m) => {
        if (m < 1) return currentLang === 'en' ? '<1min' : currentLang === 'zh-TW' ? '<1分鐘' : '<1分钟';
        if (m < 60) return currentLang === 'en' ? `${Math.round(m)}min` : currentLang === 'zh-TW' ? `${Math.round(m)}分鐘` : `${Math.round(m)}分钟`;
        const h = Math.floor(m / 60);
        const min = Math.round(m % 60);
        return currentLang === 'en' ? `${h}h${min}m` : currentLang === 'zh-TW' ? `${h}小時${min}分鐘` : `${h}小时${min}分钟`;
      };
      
      const dynamicETA = calculateDynamicETA(info.queueNumber);
      let etaText = t.waiting;
      
      if (dynamicETA) {
        etaText = formatTime(dynamicETA.minutes);
      } else if (info.estimatedWait) {
        const minutes1 = info.estimatedWait / RATE_PER_MINUTE;
        etaText = formatTime(minutes1);
      }
      
      etaEl.textContent = etaText;
    }
    
    if (info.bookingRate && rateEl) rateEl.textContent = info.bookingRate + '%';
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    const isDown = lastQueueNumber !== null && info.queueNumber < lastQueueNumber;
    
    if (queueLog.length === 0 || queueLog[0].number !== info.queueNumber) {
      lastQueueNumber = info.queueNumber;
      queueLog.unshift({ time: timeStr, number: info.queueNumber, down: isDown });
      if (queueLog.length > 20) queueLog.pop();
    }
    
    if (logEl) {
      logEl.innerHTML = queueLog.map(l => `<div class="nol-noti-log-entry"><span class="nol-noti-log-time">${l.time}</span><span class="nol-noti-log-num ${l.down ? 'down' : ''}">${l.number.toLocaleString()}</span></div>`).join('');
    }
}
  
  function getQueueFromDOM() {
    let queueNumber = null;
    const strongs = document.querySelectorAll('strong');
    for (const strong of strongs) {
      const text = strong.innerText.replace(/,/g, '');
      const num = parseInt(text);
      if (Number.isFinite(num) && num > 100 && num < 1000000) {
        queueNumber = num;
        break;
      }
    }

    let estimatedWait = null;
    const rightContainers = document.querySelectorAll('[class*="StatusBox_columnRight"]');
    for (const container of rightContainers) {
      if (container.getAttribute('data-rate') !== null) continue;
      const text = container.innerText.replace(/,/g, '');
      const num = parseInt(text);
      if (Number.isFinite(num) && num > 0) { estimatedWait = num; break; }
    }

    let bookingRate = null;
    const rateContainer = document.querySelector('[class*="StatusBox_columnRight"][data-rate]');
    if (rateContainer) {
      const rateAttr = rateContainer.getAttribute('data-rate');
      if (rateAttr) bookingRate = parseInt(rateAttr);
    }

    if (queueNumber === null) return null;
    return { queueNumber, estimatedWait, bookingRate: Number.isFinite(bookingRate) ? bookingRate : null };
  }

  function cleanWebhook(url) {
    // Remove trailing path like /Body Text, /test, etc. but keep the device key
    // Bark URL format: https://api.day.app/DEVICE_KEY
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length > 1) {
        // Remove everything after first path segment
        urlObj.pathname = '/' + pathParts[0];
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  function cleanWebhook(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length > 1) {
        urlObj.pathname = '/' + pathParts[0];
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  async function checkThreshold(info) {
    console.log('[NOL Noti] checkThreshold called, currentLang:', currentLang);
    const result = await chrome.storage.local.get(['threshold', 'barkWebhook', 'soundEnabled']);
    const threshold = result.threshold || 1000;
    const webhook = cleanWebhook(result.barkWebhook);
    const soundEnabled = result.soundEnabled !== false;
    const queueNum = info.queueNumber.toLocaleString();

    const lang = currentLang || 'zh-CN';
    const t = translations[lang];
    console.log('[NOL Noti] Using lang:', lang, 'msg:', t?.notifyThreshold);
    const turnMsg = t.notifyTurn.replace('{n}', queueNum);
    const thresholdMsg = t.notifyThreshold.replace('{n}', queueNum);

    if (info.queueNumber === 0) {
      monitoring = false;
      if (soundEnabled) {
        chrome.runtime.sendMessage({ action: 'playAlertSound' });
        const stopBtn = panelElement?.querySelector('#nol-stop-sound');
        if (stopBtn) stopBtn.style.display = 'block';
      }
      if (webhook) fetch(webhook + '?sound=alarm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'NOL Noti', body: turnMsg }) }).catch(() => {});
      return;
    }

    if (info.queueNumber <= threshold && webhook && thresholdNotificationCount < MAX_THRESHOLD_NOTIFICATIONS) {
      thresholdNotificationCount++;
      console.log('[NOL Noti] Sending threshold notification:', thresholdMsg);
      fetch(webhook + '?sound=alarm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'NOL Noti', body: thresholdMsg }) }).catch(() => {});
    }
  }

  function sendQueueInfo(info) {
    if (info && info.queueNumber !== null && info.queueNumber !== undefined) {
      if (sentQueueNumbers.has(info.queueNumber)) return;
      sentQueueNumbers.add(info.queueNumber);
      lastQueueInfo = info;
      if (monitoring) { updatePanel(info); checkThreshold(info); }
      try { chrome.runtime.sendMessage({ action: 'queueUpdate', info, url: location.href }); } catch (e) {}
    }
  }

  function startPolling() {
    setInterval(() => {
      if (!monitoring) return;
      const info = getQueueFromDOM();
      if (info) sendQueueInfo(info);
    }, 2000);
  }

  // Initialize
  createPanel();
  loadSettings().then(() => {
    if (panelElement) panelElement.style.display = enabled ? 'block' : 'none';
    if (enabled) {
      monitoring = true;
      thresholdNotificationCount = 0;
      startPolling();
    }
  });

  function playAlertSound() {
    console.log('[NOL Noti] Playing sound...');
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Stop any existing interval
    if (window.alertInterval) {
      clearInterval(window.alertInterval);
    }
    
    function playSoundPattern() {
      // 警报声 - 连续3声
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 1000;
          osc.type = 'square';
          gain.gain.setValueAtTime(1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }, i * 500);
      }
    }
    
    // Play immediately
    playSoundPattern();
    
    // Loop every 2 seconds
    window.alertInterval = setInterval(playSoundPattern, 2000);
    
    // Auto stop after 60 seconds
    setTimeout(() => {
      if (window.alertInterval) {
        clearInterval(window.alertInterval);
        window.alertInterval = null;
      }
    }, 60000);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'playAlertSound') {
      console.log('[NOL Noti] Received playAlertSound');
      playAlertSound();
      const stopBtn = panelElement?.querySelector('#nol-stop-sound');
      if (stopBtn) stopBtn.style.display = 'block';
    } else if (message.action === 'startCountdown') {
      startCountdown();
    } else if (message.action === 'getQueueInfo') sendResponse(getQueueFromDOM());
    else if (message.action === 'getEnabled') sendResponse({ enabled });
    else if (message.action === 'setPanelVisibility') {
      enabled = message.visible;
      monitoring = enabled;
      if (enabled) thresholdNotificationCount = 0;
      if (panelElement) panelElement.style.display = enabled ? 'block' : 'none';
      sendResponse({ done: true });
    }
    return true;
  });

  console.log('[NOL Noti] Panel initialized');
})();