// Service worker for future background tasks
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  
  // Initialize default enabled state if not set
  const settings = await chrome.storage.sync.get({ enabled: true });
  if (settings.enabled === undefined) {
    await chrome.storage.sync.set({ enabled: true });
  }
});

// When a new tab is created or updated, send it the current enabled state
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    try {
      // Get current enabled state
      const settings = await chrome.storage.sync.get({ enabled: true });
      
      // Send current state to the tab
      chrome.tabs.sendMessage(tabId, { 
        action: 'toggleExtension', 
        enabled: settings.enabled 
      }).catch(() => {
        // Suppress errors - content script might not be ready
      });
    } catch (error) {
      console.error('Error communicating with tab:', error);
    }
  }
});

// Listen for token stat updates from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'tokenStatsUpdated') {
    // Store the updated stats so popup can access them later
    // We don't need to do anything else here since StorageManager
    // already updated the stats in storage
    console.log('Token stats updated:', message.stats);
    return true; // Return true to indicate async response
  }
}); 