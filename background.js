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
  // Update panel - try sending to current tab
  if (toggleState === false) {
    // When turning OFF, hide panel regardless of page
    chrome.tabs.sendMessage(tab.id, { 
      action: 'setPanelVisibility', 
      visible: false 
    }).catch(() => {});
  } else if (tab.url?.includes('tickets.interpark.com/waiting')) {
    // When turning ON, only show panel on waiting page
    chrome.tabs.sendMessage(tab.id, { 
      action: 'setPanelVisibility', 
      visible: true 
    }).catch(() => {});
  }
});
