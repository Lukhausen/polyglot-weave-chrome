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
    const spanElement = document.createElement('span');
    spanElement.className = 'polyglow-weave-highlight';
    spanElement.style.display = 'inline';
    textNode.parentNode.replaceChild(spanElement, textNode);
    spanElement.appendChild(textNode);
    return spanElement;
  }
}; 