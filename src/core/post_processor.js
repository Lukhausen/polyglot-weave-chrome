window.PostProcessor = {
  /**
   * Processes the original and modified text to highlight differences
   * @param {string} originalText - The original unmodified text
   * @param {string} modifiedText - The text after TextProcessor modifications
   * @returns {Node[]} Array of text and span nodes
   */
  processTextDifferences: function(originalText, modifiedText, replacements) {
    const nodes = [];
    let currentIndex = 0;

    // Sort replacements by their position in the text (to handle overlapping replacements)
    const sortedReplacements = replacements.sort((a, b) => {
      const indexA = modifiedText.indexOf(a.replacement);
      const indexB = modifiedText.indexOf(b.replacement);
      return indexA - indexB;
    });

    // Process each replacement
    sortedReplacements.forEach(({ original, replacement }) => {
      const replacementIndex = modifiedText.indexOf(replacement, currentIndex);
      
      if (replacementIndex > currentIndex) {
        // Add text before the replacement
        nodes.push(document.createTextNode(
          modifiedText.substring(currentIndex, replacementIndex)
        ));
      }

      if (replacementIndex !== -1) {
        // Create highlighted span for the replacement
        const span = document.createElement('span');
        span.className = 'polyglow-weave-highlight';
        span.textContent = replacement;
        span.title = `Original: ${original}`;
        nodes.push(span);
        
        currentIndex = replacementIndex + replacement.length;
      }
    });

    // Add any remaining text after the last replacement
    if (currentIndex < modifiedText.length) {
      nodes.push(document.createTextNode(
        modifiedText.substring(currentIndex)
      ));
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