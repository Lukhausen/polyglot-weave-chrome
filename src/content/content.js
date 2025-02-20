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

/**
 * ⚠️ CRITICAL PERFORMANCE OPTIMIZATION - DO NOT REMOVE OR MODIFY ⚠️
 * 
 * This implementation uses a sophisticated lazy-loading mechanism to process text
 * only when it becomes visible in the viewport. This is crucial for:
 * 
 * 1. Performance: Prevents unnecessary processing of off-screen content
 * 2. Memory Usage: Reduces memory overhead by only storing processed text when needed
 * 3. User Experience: Ensures smooth scrolling and page responsiveness
 * 
 * Key Components:
 * - pendingProcessing WeakMap: Stores text nodes waiting for processing
 * - Intersection Observer: Triggers processing only when content is visible
 * - Placeholder Elements: Lightweight spans that track visibility
 * 
 * Removing or modifying this system will result in:
 * - Increased CPU usage
 * - Higher memory consumption
 * - Potential page freezes on large documents
 * - Poor user experience
 * 
 * If modifications are needed, ensure the visibility-based processing
 * mechanism remains intact.
 */

// State tracking
const state = {
  processedNodes: new WeakSet(),
  processedElements: new WeakSet(),
  pendingProcessing: new WeakMap() // Store text nodes waiting to be processed
};

// Initialize intersection observer
const intersectionObserver = new IntersectionObserver(entries => {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      const textNode = state.pendingProcessing.get(entry.target);
      if (textNode) {
        await processVisibleText(textNode);
        state.pendingProcessing.delete(entry.target);
      }
      intersectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

// Process visible text
async function processVisibleText(textNode) {
  try {
    const originalText = textNode.textContent;
    const processedText = await TextProcessor.processText(originalText);
    
    // Only proceed if there are actual changes
    if (originalText !== processedText) {
      const nodes = PostProcessor.processTextDifferences(
        originalText,
        processedText
      );
      
      // Replace the text node with the processed nodes
      const fragment = document.createDocumentFragment();
      nodes.forEach(n => fragment.appendChild(n));
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  } catch (error) {
    console.error("Error processing text:", error);
  }
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
      state.processedNodes.add(textNode);
      
      // Create a placeholder element for intersection observation
      const placeholder = document.createElement('span');
      placeholder.style.display = 'inline';
      textNode.parentNode.insertBefore(placeholder, textNode);
      
      // Store the text node for processing when visible
      state.pendingProcessing.set(placeholder, textNode);
      intersectionObserver.observe(placeholder);
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