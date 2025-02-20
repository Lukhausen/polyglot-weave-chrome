window.DOMUtils = {
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

  wrapTextNode(textNode) {
    const markElement = document.createElement('mark');
    markElement.style.display = 'inline';
    textNode.parentNode.replaceChild(markElement, textNode);
    markElement.appendChild(textNode);
    return markElement;
  }
}; 