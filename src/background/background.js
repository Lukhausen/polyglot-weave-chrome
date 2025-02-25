// Service worker for future background tasks
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
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