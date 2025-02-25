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

    // Sort replacements by their position in the text
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
        
        // Store the original text as a data attribute
        span.dataset.original = original;
        
        // Add title attribute as fallback for environments where JS is disabled
        span.title = `Original: ${original}`;
        
        // Add mouseover event to create tooltip on demand
        span.addEventListener('mouseover', this.showTooltip);
        span.addEventListener('mouseout', this.hideTooltip);
        
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
   * Shows tooltip on highlighted text using Shadow DOM
   * 
   * The Shadow DOM approach ensures tooltips are visible regardless of
   * page styling by creating an isolated DOM tree that's not affected
   * by parent element properties like overflow:hidden or z-index.
   * @private
   */
  showTooltip: function(event) {
    const span = event.currentTarget;
    const original = span.dataset.original;
    
    // Get span position - we need this to position the tooltip
    const rect = span.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top;
    
    // Use the shadow DOM tooltip if available (preferred method)
    if (window.PolyglotTooltip) {
      window.PolyglotTooltip.show(`Original: ${original}`, x, y);
    } else {
      // Fallback to the traditional method if shadow DOM isn't available
      let tooltip = document.getElementById('polyglow-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'polyglow-tooltip';
        document.body.appendChild(tooltip);
      }
      
      tooltip.textContent = `Original: ${original}`;
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.style.visibility = 'visible';
      tooltip.style.opacity = '1';
    }
  },

  /**
   * Hides tooltip
   * @private
   */
  hideTooltip: function(event) {
    if (window.PolyglotTooltip) {
      window.PolyglotTooltip.hide();
    } else {
      const tooltip = document.getElementById('polyglow-tooltip');
      if (tooltip) {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      }
    }
  },

  /**
   * Wraps text in highlight span
   * @private
   */
  wrapInHighlight: function(text) {
    return `<span class="polyglow-weave-highlight">${text}</span>`;
  }
}; 