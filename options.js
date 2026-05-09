const thresholdInput = document.getElementById('threshold');
const barkWebhookInput = document.getElementById('barkWebhook');
const barkEnabledInput = document.getElementById('barkEnabled');
const soundEnabledInput = document.getElementById('soundEnabled');
const saveBtn = document.getElementById('saveBtn');
const statusDiv = document.getElementById('status');

async function loadSettings() {
  const result = await chrome.storage.local.get([
    'threshold',
    'barkWebhook',
    'barkEnabled',
    'soundEnabled'
  ]);
  
  thresholdInput.value = result.threshold || 1000;
  barkWebhookInput.value = result.barkWebhook || '';
  barkEnabledInput.checked = result.barkEnabled !== false;
  soundEnabledInput.checked = result.soundEnabled !== false;
}

async function saveSettings() {
  const settings = {
    threshold: parseInt(thresholdInput.value) || 1000,
    barkWebhook: barkWebhookInput.value.trim(),
    barkEnabled: barkEnabledInput.checked,
    soundEnabled: soundEnabledInput.checked
  };

  await chrome.storage.local.set(settings);
  
  showStatus('设置已保存', 'success');
}

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

saveBtn.addEventListener('click', saveSettings);

loadSettings();