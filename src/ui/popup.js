document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    apiKey: document.getElementById('apiKey'),
    language: document.getElementById('languageSetting'),
    level: document.getElementById('languageLevel'),
    slider: document.getElementById('sliderValue')
  };

  // Load saved settings
  loadSettings();

  // Add auto-save listeners
  Object.entries(elements).forEach(([key, element]) => {
    const event = element.type === 'range' ? 'input' : 'change';
    element.addEventListener(event, () => {
      saveSetting(key, element.value);
    });
  });

  async function loadSettings() {
    const settings = await StorageManager.getSettings();
    Object.entries(elements).forEach(([key, element]) => {
      if (settings[key]) {
        element.value = settings[key];
      }
    });
  }

  async function saveSetting(key, value) {
    await StorageManager.updateSetting(key, value);
    notifyContentScript(key);
  }

  async function notifyContentScript(updatedKey) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (key) => {
          console.log(`Setting ${key} updated`);
        },
        args: [updatedKey]
      });
    }
  }
}); 