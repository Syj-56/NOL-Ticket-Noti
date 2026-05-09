console.log('[NOL Noti Background] Loaded');
console.log('[NOL Noti Background] Testing console');

const action = chrome.action || chrome.browserAction;

// Simple counter for toggle state
let toggleState = true;

function updateBadge() {
  const text = toggleState ? 'ON' : 'OFF';
  const title = toggleState ? 'NOL Noti by Syj - ON' : 'NOL Noti by Syj - OFF';
  console.log('[NOL Noti] Badge:', text);
  
  action.setBadgeText({ text: text });
  action.setBadgeBackgroundColor({ color: '#10B981' });
  action.setTitle({ title: title });
}

// Initial
updateBadge();

action.onClicked.addListener((tab) => {
  console.log('[NOL Noti] Click');
  
  if (!tab.url?.includes('tickets.interpark.com/waiting')) return;
  
  // Toggle
  toggleState = !toggleState;
  console.log('Toggle to:', toggleState);
  
  updateBadge();
  
  // Also update storage
  chrome.storage.local.set({ pluginEnabled: toggleState });
  
  // Update panel
  chrome.tabs.sendMessage(tab.id, { 
    action: 'setPanelVisibility', 
    visible: toggleState 
  }).catch(() => {});
});

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

// Listen for URL changes - detect booking page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('[NOL Noti] tab updated, url:', changeInfo.url);
  if (changeInfo.url && changeInfo.url.includes('gpoticket.globalinterpark.com') && changeInfo.url.includes('BookMain')) {
    console.log('[NOL Noti] Booking page detected');
    
    // Get webhook, sound setting and language
    chrome.storage.local.get(['barkWebhook', 'soundEnabled', 'language'], (result) => {
      const lang = result.language || 'zh-CN';
      const msgs = {
        'zh-CN': '已进入NOL购票页面，请在10分钟内完成购票',
        'zh-TW': '已進入NOL購票頁面，請在10分鐘內完成購票',
        'en': 'Entered NOL booking page, please complete purchase within 10 minutes'
      };
      
      if (result.barkWebhook) {
        const webhook = cleanWebhook(result.barkWebhook) + '?sound=alarm';
        // Send 3 notifications with 1 second delay
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            fetch(webhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: 'NOL Noti', body: msgs[lang] })
            }).catch(() => {});
          }, i * 1000);
        }
      }
      
      // Play sound if enabled and start countdown
      console.log('[NOL Noti] soundEnabled:', result.soundEnabled, 'tabId:', tabId);
      setTimeout(() => {
        if (result.soundEnabled !== false) {
          chrome.tabs.sendMessage(tabId, { action: 'playAlertSound' }).then(() => console.log('[NOL Noti] playAlertSound sent')).catch(e => console.log('[NOL Noti] sendMessage error:', e));
        }
        chrome.tabs.sendMessage(tabId, { action: 'startCountdown' }).catch(() => {});
      }, 1000);
    });
  }
});

// Handle sound request from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'playAlertSound') {
    // Forward to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'playAlertSound' }).catch(() => {});
      }
    });
  }
});