console.log("Content script is running!");

// --- Configuration Arrays ---
const targetElements = [
  'p', 'div', 'article', 'section', 'h1', 'h2', 'h3', 
  'h4', 'h5', 'h6', 'li', 'td', 'span', 'pre', 'blockquote'
];
const excludedElements = [
  'script', 'style', 'noscript', 'code', 'input',
  'textarea', 'select', 'button', 'label'
];

// --- Processed Node/Element Tracking ---
const processedNodes = new WeakSet();
const processedElements = new WeakSet();

// --- Visibility Check ---
function isVisible(element) {
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
}

// --- Intersection Observer for <mark> elements ---
// This observer triggers processing (capitalization) when a wrapped text node becomes visible.
const intersectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const markElement = entry.target;
      // Process each child text node inside the <mark>
      markElement.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const originalText = node.textContent;
          setTimeout(() => {
            const capitalizedText = originalText.toUpperCase();
            node.textContent = capitalizedText;
            console.log("Text node capitalized after 2 seconds:", capitalizedText.substring(0, 20) + "...");
          }, 2000);
        }
      });
      intersectionObserver.unobserve(markElement);
    }
  });
}, { threshold: 0.1 });

// --- Wrap a text node in a <mark> element ---
function wrapTextNode(textNode) {
  const markElement = document.createElement('mark');
  markElement.style.display = 'inline';
  // Replace the original text node with the <mark> wrapper,
  // then append the text node into it so we preserve the original node.
  textNode.parentNode.replaceChild(markElement, textNode);
  markElement.appendChild(textNode);
  return markElement;
}

// --- Process an element by wrapping all its unprocessed text nodes ---
function processElement(element) {
  if (processedElements.has(element)) return;
  if (excludedElements.includes(element.nodeName.toLowerCase())) return;
  if (!isVisible(element)) return;
  
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Ignore empty text or text whose parent is an excluded element
        if (node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && excludedElements.includes(node.parentNode.nodeName.toLowerCase())) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (!processedNodes.has(textNode)) {
      const markElement = wrapTextNode(textNode);
      processedNodes.add(markElement);
      intersectionObserver.observe(markElement);
    }
  }
  
  processedElements.add(element);
}

// --- Initialize processing on existing elements and set up DOM observer ---
function initialize() {
  // Process current target elements in the DOM
  targetElements.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      if (!processedElements.has(element) && isVisible(element)) {
        processElement(element);
      }
    });
  });
  
  // Observe DOM mutations to catch dynamically added content
  const domObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // If the added node is a target element, process it
          if (targetElements.includes(node.nodeName.toLowerCase())) {
            processElement(node);
          }
          // Also check any descendants that match the target selectors
          node.querySelectorAll(targetElements.join(',')).forEach(child => {
            processElement(child);
          });
        }
      });
    });
  });
  
  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// --- Start processing when page is fully loaded ---
if (document.readyState === 'complete') {
  initialize();
} else {
  window.addEventListener('load', initialize);
}
