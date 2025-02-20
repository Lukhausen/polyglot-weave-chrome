/**
 * Wraps a text node in a <mark> element.
 * @param {Text} textNode
 * @returns {Element} The created <mark> element.
 */
window.TextProcessor = {
  wrapTextNode: function(textNode) {
    const markElement = document.createElement('mark');
    markElement.style.display = 'inline';
    textNode.parentNode.replaceChild(markElement, textNode);
    markElement.appendChild(textNode);
    return markElement;
  },

  /**
   * Processes text with a delay and returns a promise with the processed text
   * @param {string} text - The text to process
   * @returns {Promise<string>} A promise that resolves with the processed text after delay
   */
  processText: async function(text) {
    
    // Process the text (currently just capitalizing)
    return this.capitalizeText(text);
  },

  /**
   * Capitalizes the input text
   * @param {string} text
   * @returns {string}
   */
  capitalizeText: function(text) {
    return text.toUpperCase();
  }
}; 