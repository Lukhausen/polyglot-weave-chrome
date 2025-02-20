// content.js
console.log("Content script running!");
TestModule.testModule();

// --- Configuration ---
// Target elements whose text nodes should be processed.
const targetElements = [
  'p', 'div', 'article', 'section', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'li', 'td', 'span', 'pre', 'blockquote'
];
// Elements to exclude from processing.
const excludedElements = [
  'script', 'style', 'noscript', 'code', 'input',
  'textarea', 'select', 'button', 'label'
];

// --- Tracking Processed Nodes and Elements ---
const processedNodes = new WeakSet();
const processedElements = new WeakSet();

// --- Utility Functions ---
/**
 * Determines if an element is visible within the viewport.
 * @param {Element} element
 * @returns {boolean}
 */
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

function wrapTextNode(textNode) {
  const markElement = document.createElement('mark');
  markElement.style.display = 'inline';
  textNode.parentNode.replaceChild(markElement, textNode);
  markElement.appendChild(textNode);
  return markElement;
}

// --- Intersection Observer ---
// Observes <mark> elements and processes their text when visible.
const intersectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const markElement = entry.target;
      markElement.childNodes.forEach(async node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const originalText = node.textContent;
          try {
            const processedText = await TextProcessor.processText(originalText);
            node.textContent = processedText;
            console.log("Text node processed:", processedText.substring(0, 20) + "...");
          } catch (error) {
            console.error("Error processing text:", error);
          }
        }
      });
      intersectionObserver.unobserve(markElement);
    }
  });
}, { threshold: 0.1 });

// --- Processing Functions ---
/**
 * Processes an element by wrapping all its unprocessed text nodes that contain at least 5 actual words.
 * @param {Element} element
 */
function processElement(element) {
  if (processedElements.has(element)) return;
  if (excludedElements.includes(element.nodeName.toLowerCase())) return;
  if (!isVisible(element)) return;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const text = node.textContent.trim();
        if (text.length === 0) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && excludedElements.includes(node.parentNode.nodeName.toLowerCase())) {
          return NodeFilter.FILTER_REJECT;
        }
        // Split on whitespace and count tokens that contain a word character.
        const words = text.split(/\s+/).filter(word => /\w/.test(word));
        if (words.length < 5) return NodeFilter.FILTER_REJECT;
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

/**
 * Initializes processing of the DOM: processes existing elements and sets up a MutationObserver for new content.
 */
function initialize() {
  // Process all current target elements.
  targetElements.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      if (!processedElements.has(element) && isVisible(element)) {
        processElement(element);
      }
    });
  });

  // Observe DOM mutations to catch dynamically added elements.
  const domObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (targetElements.includes(node.nodeName.toLowerCase())) {
            processElement(node);
          }
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

// --- Start Processing on Page Load ---
if (document.readyState === 'complete') {
  initialize();
} else {
  window.addEventListener('load', initialize);
}
