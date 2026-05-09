const statusEl = document.getElementById('status');
const toggleBtn = document.getElementById('toggleBtn');

let enabled = true;

async function updateStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url?.includes('tickets.interpark.com/waiting')) {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getEnabled' });
      enabled = response?.enabled ?? true;
    }
  } catch (e) {
    enabled = true;
  }
  
  if (enabled) {
    statusEl.textContent = '开启中';
    statusEl.className = 'status on';
    toggleBtn.textContent = '关闭';
    toggleBtn.className = 'toggle-btn on';
  } else {
    statusEl.textContent = '已关闭';
    statusEl.className = 'status off';
    toggleBtn.textContent = '开启';
    toggleBtn.className = 'toggle-btn off';
  }
}

toggleBtn.addEventListener('click', async () => {
  enabled = !enabled;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { action: 'setEnabled', enabled: enabled });
    }
  } catch (e) {}
  
  updateStatus();
});

// Auto-show panel when popup opens
chrome.runtime.sendMessage({ action: 'showPanel' });

updateStatus();