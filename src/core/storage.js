window.StorageManager = {
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'apiKey',
        'language',
        'languageLevel',
        'sliderValue'
      ], (result) => {
        resolve({
          apiKey: result.apiKey || '',
          language: result.language || '',
          languageLevel: result.languageLevel || 'beginner',
          sliderValue: result.sliderValue || '50'
        });
      });
    });
  },

  async setSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, resolve);
    });
  },

  async updateSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.setSettings(settings);
    return settings;
  }
}; 