/**
 * DOM Utilities
 * Helper functions for DOM manipulation and element visibility detection
 */
window.DOMUtils = {
  /**
   * Checks if an element is visible in the viewport
   * @param {Element} element - The element to check
   * @returns {boolean} True if element is visible
   */
  isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      style.visibility === 'visible' &&
      style.display !== 'none' &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top <= window.innerHeight &&
      rect.bottom >= 0
    );
  },

  /**
   * Wraps a text node in a span element for highlighting
   * @param {Node} textNode - Text node to wrap
   * @returns {Element} The created span element
   */
  wrapTextNode(textNode) {
    const spanElement = document.createElement('span');
    spanElement.className = 'polyglow-weave-highlight';
    spanElement.style.display = 'inline';
    textNode.parentNode.replaceChild(spanElement, textNode);
    spanElement.appendChild(textNode);
    return spanElement;
  }
}; 