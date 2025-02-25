window.StorageManager = {
  async getSettings() {
    const defaults = {
      apiKey: '',
      languageSetting: '',
      languageLevel: 'beginner',
      sliderValue: '50',
      enabled: true,
      tokenStats: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        lastUpdated: Date.now()
      }
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
  },

  async updateTokenStats(newStats) {
    const settings = await this.getSettings();
    settings.tokenStats = {
      ...newStats,
      lastUpdated: Date.now()
    };
    await this.setSettings(settings);
    return settings.tokenStats;
  }
}; 