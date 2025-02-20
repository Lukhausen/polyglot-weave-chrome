window.PostProcessor = {
  /**
   * Processes the original and modified text to highlight differences
   * @param {string} originalText - The original unmodified text
   * @param {string} modifiedText - The text after TextProcessor modifications
   * @returns {Node[]} Array of text and span nodes
   */
  processTextDifferences: function(originalText, modifiedText) {
    const originalWords = originalText.split(/(\s+)/);
    const modifiedWords = modifiedText.split(/(\s+)/);
    const nodes = [];
    
    let i = 0;
    while (i < originalWords.length && i < modifiedWords.length) {
      if (originalWords[i] !== modifiedWords[i]) {
        // Create span for modified word
        const span = document.createElement('span');
        span.className = 'polyglow-weave-highlight';
        span.textContent = modifiedWords[i];
        // Add original word as title for tooltip
        span.title = `Original: ${originalWords[i]}`;
        nodes.push(span);
      } else {
        // Keep original word/whitespace as text node
        nodes.push(document.createTextNode(originalWords[i]));
      }
      i++;
    }
    
    // Add any remaining words
    while (i < originalWords.length) {
      nodes.push(document.createTextNode(originalWords[i]));
      i++;
    }
    
    return nodes;
  },

  /**
   * Wraps text in highlight span
   * @private
   */
  wrapInHighlight: function(text) {
    return `<span class="polyglow-weave-highlight">${text}</span>`;
  }
}; 