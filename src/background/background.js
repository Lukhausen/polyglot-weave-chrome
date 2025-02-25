/**
 * Polyglot Weave Background Service Worker
 * Handles extension installation, tab updates, and messaging
 */

// Extension initialization
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Polyglot Weave installed');
  
  // Initialize default settings if not already set
  const settings = await chrome.storage.sync.get({ enabled: true });
  if (settings.enabled === undefined) {
    await chrome.storage.sync.set({ enabled: true });
  }
});

// Communicate with tabs when they are updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only send messages to fully loaded, non-chrome pages
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    try {
      // Get current enabled state
      const settings = await chrome.storage.sync.get({ enabled: true });
      
      // Send current state to the tab (silently catch errors if content script isn't ready)
      chrome.tabs.sendMessage(tabId, { 
        action: 'toggleExtension', 
        enabled: settings.enabled 
      }).catch(() => {});
    } catch (error) {
      console.error('Error communicating with tab:', error);
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'tokenStatsUpdated') {
    // Log token stats updates (StorageManager already saves them)
    console.log('Token stats updated:', message.stats);
    return true; // Indicate async response
  }
}); 