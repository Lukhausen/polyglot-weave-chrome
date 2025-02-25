/**
 * PostProcessor
 * Handles text highlighting and tooltip functionality
 */
window.PostProcessor = {
  /**
   * Processes the original and modified text to highlight differences
   * @param {string} originalText - The original unmodified text
   * @param {string} modifiedText - The text after TextProcessor modifications
   * @param {Array} replacements - Replacement objects with original and replacement text
   * @returns {Node[]} Array of text and span nodes
   */
  processTextDifferences(originalText, modifiedText, replacements) {
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
        const span = this.createHighlightSpan(replacement, original);
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
   * Creates a highlighted span element with event listeners
   * @param {string} replacement - The replacement text
   * @param {string} original - The original text
   * @returns {HTMLSpanElement} The created span element
   */
  createHighlightSpan(replacement, original) {
    const span = document.createElement('span');
    span.className = 'polyglow-weave-highlight';
    span.textContent = replacement;
    
    // Store the original text as a data attribute
    span.dataset.original = original;
    
    // Add title attribute as fallback
    span.title = `Original: ${original}`;
    
    // Add event listeners for tooltip
    span.addEventListener('mouseover', this.showTooltip);
    span.addEventListener('mouseout', this.hideTooltip);
    
    return span;
  },

  /**
   * Shows tooltip on highlighted text using Shadow DOM
   * @param {Event} event - The mouseover event
   */
  showTooltip(event) {
    const span = event.currentTarget;
    const original = span.dataset.original;
    
    // Get span position for tooltip placement
    const rect = span.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top;
    
    // Use the shadow DOM tooltip if available
    if (window.PolyglotTooltip) {
      window.PolyglotTooltip.show(`Original: ${original}`, x, y);
    } else {
      // Fallback to traditional tooltip
      let tooltip = document.getElementById('polyglow-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'polyglow-tooltip';
        document.body.appendChild(tooltip);
      }
      
      tooltip.textContent = `${original}`;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.classList.add('tooltip-visible');
      tooltip.classList.remove('tooltip-hidden');
    }
  },

  /**
   * Hides tooltip
   * @param {Event} event - The mouseout event
   */
  hideTooltip(event) {
    if (window.PolyglotTooltip) {
      window.PolyglotTooltip.hide();
    } else {
      const tooltip = document.getElementById('polyglow-tooltip');
      if (tooltip) {
        tooltip.classList.add('tooltip-hidden');
        tooltip.classList.remove('tooltip-visible');
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