document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    apiKey: document.getElementById('apiKey'),
    languageSetting: document.getElementById('languageSetting'),
    languageLevel: document.getElementById('languageLevel'),
    sliderValue: document.getElementById('sliderValue'),
    promptTokens: document.getElementById('promptTokens'),
    completionTokens: document.getElementById('completionTokens'),
    totalTokens: document.getElementById('totalTokens'),
    lastUpdated: document.getElementById('lastUpdated')
  };

  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }

  function updateTokenDisplay(stats) {
    elements.promptTokens.textContent = formatNumber(stats.promptTokens);
    elements.completionTokens.textContent = formatNumber(stats.completionTokens);
    elements.totalTokens.textContent = formatNumber(stats.totalTokens);
    elements.lastUpdated.textContent = formatDate(stats.lastUpdated);
  }

  // Listen for token stat updates from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'tokenStatsUpdated') {
      updateTokenDisplay(message.stats);
    }
  });

  function showSaveEffect(element) {
    element.style.backgroundColor = '#e8f0fe';
    setTimeout(() => element.style.backgroundColor = '', 300);
  }

  async function loadSettings() {
    const settings = await StorageManager.getSettings();
    
    // Update settings inputs
    Object.entries(elements).forEach(([key, element]) => {
      if (!settings[key]) return;
      
      if (element.tagName === 'SELECT') {
        const hasOption = Array.from(element.options).some(opt => opt.value === settings[key]);
        element.value = hasOption ? settings[key] : element.options[0].value;
      } else if (['promptTokens', 'completionTokens', 'totalTokens', 'lastUpdated'].includes(key)) {
        // Skip token display elements
        return;
      } else {
        element.value = settings[key];
      }
    });

    // Update token display
    updateTokenDisplay(settings.tokenStats);
  }

  // Add listeners and load settings
  Object.entries(elements).forEach(([key, element]) => {
    if (['promptTokens', 'completionTokens', 'totalTokens', 'lastUpdated'].includes(key)) {
      return; // Skip token display elements
    }
    element.addEventListener(
      element.type === 'range' ? 'input' : 'change',
      async () => {
        await StorageManager.updateSetting(key, element.value);
        showSaveEffect(element);
      }
    );
  });

  await loadSettings();
}); 