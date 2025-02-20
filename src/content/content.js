// Configuration
const CONFIG = {
  targetElements: [
    'p', 'div', 'article', 'section', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'li', 'td', 'span', 'pre', 'blockquote'
  ],
  excludedElements: [
    'script', 'style', 'noscript', 'code', 'input',
    'textarea', 'select', 'button', 'label'
  ]
};

// State tracking
const state = {
  processedNodes: new WeakSet(),
  processedElements: new WeakSet()
};

// Initialize intersection observer
const intersectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      processVisibleElement(entry.target);
      intersectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

// Process visible elements
async function processVisibleElement(markElement) {
  markElement.childNodes.forEach(async node => {
    if (node.nodeType === Node.TEXT_NODE) {
      try {
        const processedText = await TextProcessor.processText(node.textContent);
        node.textContent = processedText;
      } catch (error) {
        console.error("Error processing text:", error);
      }
    }
  });
}

// Process elements
function processElement(element) {
  if (state.processedElements.has(element)) return;
  if (CONFIG.excludedElements.includes(element.nodeName.toLowerCase())) return;
  if (!DOMUtils.isVisible(element)) return;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const text = node.textContent.trim();
        if (text.length === 0) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && CONFIG.excludedElements.includes(node.parentNode.nodeName.toLowerCase())) {
          return NodeFilter.FILTER_REJECT;
        }
        const words = text.split(/\s+/).filter(word => /\w/.test(word));
        if (words.length < 5) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (!state.processedNodes.has(textNode)) {
      const markElement = DOMUtils.wrapTextNode(textNode);
      state.processedNodes.add(textNode);
      intersectionObserver.observe(markElement);
    }
  }
  state.processedElements.add(element);
}

// Initialize processing
function initialize() {
  CONFIG.targetElements.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      if (!state.processedElements.has(element) && DOMUtils.isVisible(element)) {
        processElement(element);
      }
    });
  });

  // Observe DOM mutations
  const domObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (CONFIG.targetElements.includes(node.nodeName.toLowerCase())) {
            processElement(node);
          }
        }
      });
    });
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Start processing
if (document.readyState === 'complete') {
  initialize();
} else {
  window.addEventListener('load', initialize); 
} 