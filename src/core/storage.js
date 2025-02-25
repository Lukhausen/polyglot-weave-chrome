/**
 * StorageManager
 * Provides a centralized interface for all storage operations
 */
window.StorageManager = {
  // Default settings for the extension
  DEFAULTS: {
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
  },
  
  /**
   * Retrieves all settings with defaults applied
   * @returns {Promise<Object>} The current settings
   */
  async getSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get(this.DEFAULTS, resolve);
    });
  },

  /**
   * Saves all settings
   * @param {Object} settings - Complete settings object
   * @returns {Promise<void>}
   */
  async setSettings(settings) {
    return chrome.storage.sync.set(settings);
  },

  /**
   * Updates a single setting
   * @param {string} key - The setting key to update
   * @param {any} value - The new value
   * @returns {Promise<Object>} The updated settings
   */
  async updateSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.setSettings(settings);
    return settings;
  },

  /**
   * Updates token usage statistics
   * @param {Object} newStats - New token usage data
   * @returns {Promise<Object>} The updated token stats
   */
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