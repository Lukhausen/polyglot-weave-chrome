document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    apiKey: document.getElementById('apiKey'),
    languageSetting: document.getElementById('languageSetting'),
    languageLevel: document.getElementById('languageLevel'),
    sliderValue: document.getElementById('sliderValue')
  };

  function showSaveEffect(element) {
    element.style.backgroundColor = '#e8f0fe';
    setTimeout(() => element.style.backgroundColor = '', 300);
  }

  async function loadSettings() {
    const settings = await StorageManager.getSettings();
    
    Object.entries(elements).forEach(([key, element]) => {
      if (!settings[key]) return;
      
      if (element.tagName === 'SELECT') {
        const hasOption = Array.from(element.options).some(opt => opt.value === settings[key]);
        element.value = hasOption ? settings[key] : element.options[0].value;
      } else {
        element.value = settings[key];
      }
    });
  }

  // Add listeners and load settings
  Object.entries(elements).forEach(([key, element]) => {
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