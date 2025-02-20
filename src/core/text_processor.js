window.TextProcessor = {
  /**
   * Processes text based on user settings
   * @param {string} text - The text to process
   * @returns {Promise<string>} Processed text
   */
  processText: async function(text) {
    const settings = await window.StorageManager.getSettings();
    // Add 2 second delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return this.applyProcessing(text, settings);
  },

  /**
   * Applies text processing based on settings
   * @private
   */
  applyProcessing: function(text, settings) {
    // In the future, this could use the API key, language, and level settings
    // to determine how to process the text
    return this.capitalizeAlternateWords(text);
  },

  /**
   * Capitalizes every second word in the text
   * @private
   */
  capitalizeAlternateWords: function(text) {
    return text.split(/\s+/).map((word, index) => {
      return index % 2 === 1 ? word.toUpperCase() : word;
    }).join(' ');
  }
}; 