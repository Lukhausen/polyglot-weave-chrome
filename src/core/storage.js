window.StorageManager = {
  async getSettings() {
    const defaults = {
      apiKey: '',
      languageSetting: '',
      languageLevel: 'beginner',
      sliderValue: '50'
    };
    
    return new Promise(resolve => {
      chrome.storage.sync.get(defaults, resolve);
    });
  },

  async setSettings(settings) {
    return chrome.storage.sync.set(settings);
  },

  async updateSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.setSettings(settings);
    return settings;
  }
}; 