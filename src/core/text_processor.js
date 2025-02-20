window.TextProcessor = {
  /**
   * Processes text based on user settings
   * @param {string} text - The text to process
   * @returns {Promise<string>} Processed text
   */
  processText: async function(text) {
    const settings = await window.StorageManager.getSettings();
    return this.applyProcessing(text, settings);
  },

  /**
   * Applies text processing based on settings
   * @private
   */
  applyProcessing: function(text, settings) {
    // In the future, this could use the API key, language, and level settings
    // to determine how to process the text
    return this.capitalizeText(text);
  },

  /**
   * Basic text transformation
   * @private
   */
  capitalizeText: function(text) {
    return text.toUpperCase();
  }
}; 