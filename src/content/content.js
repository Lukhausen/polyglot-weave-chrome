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

// Add this at the top of the file to control logging
const DEBUG = {
  enabled: true,
  levels: {
    observer: true,
    processing: true,
    visibility: true,
    initialization: true
  },
  log: function(level, ...args) {
    if (this.enabled && this.levels[level]) {
      console.log(`[${level.toUpperCase()}]`, ...args);
    }
  }
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
  pendingProcessing: new WeakMap(), // Store text nodes waiting to be processed
  enabled: true // Default to enabled until we get settings
};

// Modify the intersection observer to include more logging
const intersectionObserver = new IntersectionObserver(entries => {
  DEBUG.log('observer', `Intersection observed: ${entries.length} entries`);
  
  entries.forEach(async entry => {
    DEBUG.log('observer', `Entry intersecting: ${entry.isIntersecting}, ratio: ${entry.intersectionRatio}`);
    if (entry.isIntersecting) {
      const textNode = state.pendingProcessing.get(entry.target);
      if (textNode) {
        DEBUG.log('observer', `Found text node to process: "${textNode.textContent.substring(0, 30)}..."`);
        await processVisibleText(textNode);
        state.pendingProcessing.delete(entry.target);
      } else {
        DEBUG.log('observer', `No text node found for this placeholder`);
      }
      intersectionObserver.unobserve(entry.target);
      DEBUG.log('observer', `Stopped observing target`);
    }
  });
}, { threshold: 0.1 });

// Process visible text
async function processVisibleText(textNode) {
  // Skip processing if extension is disabled
  if (!state.enabled) {
    DEBUG.log('processing', 'Extension disabled, skipping text processing');
    return;
  }
  
  try {
    // Check if the node is still in the document
    if (!textNode.isConnected || !textNode.parentNode) {
      console.log('Skipping disconnected node');
      return;
    }
    
    // Add a check to ensure TextProcessor is available
    if (!window.TextProcessor || typeof window.TextProcessor.processText !== 'function') {
      console.error('TextProcessor is not properly initialized');
      return;
    }
    
    const originalText = textNode.textContent;
    const result = await TextProcessor.processText(originalText);
    
    // Only proceed if there are actual changes and the node is still connected
    if (result.text !== originalText && textNode.isConnected && textNode.parentNode) {
      // Add a check for PostProcessor as well
      if (!window.PostProcessor || typeof window.PostProcessor.processTextDifferences !== 'function') {
        console.error('PostProcessor is not properly initialized');
        return;
      }
      
      const nodes = PostProcessor.processTextDifferences(
        originalText,
        result.text,
        result.replacements
      );
      
      // Replace the text node with the processed nodes
      const fragment = document.createDocumentFragment();
      nodes.forEach(n => {
        // Mark all created nodes as processed
        if (n.nodeType === Node.ELEMENT_NODE) {
          state.processedElements.add(n);
          n.setAttribute('data-polyglot-processed', 'true');
        } else if (n.nodeType === Node.TEXT_NODE) {
          state.processedNodes.add(n);
        }
        fragment.appendChild(n);
      });
      
      // Double-check that node is still connected before replacing
      if (textNode.isConnected && textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
      } else {
        console.log('Node was disconnected during processing');
      }
    }
  } catch (error) {
    console.error("Error processing text:", error, error.stack);
  }
}

// Modify processElement to include more logging
function processElement(element) {
  // Skip processing if extension is disabled
  if (!state.enabled) {
    DEBUG.log('processing', 'Extension disabled, skipping processing');
    return;
  }
  
  DEBUG.log('processing', `Checking element: ${element.nodeName}#${element.id || 'no-id'}.${element.className || 'no-class'}`);
  
  if (state.processedElements.has(element)) {
    DEBUG.log('processing', `Element already processed, skipping`);
    return;
  }
  
  if (CONFIG.excludedElements.includes(element.nodeName.toLowerCase())) {
    DEBUG.log('processing', `Element excluded by config, skipping`);
    return;
  }
  
  if (!DOMUtils.isVisible(element)) {
    DEBUG.log('visibility', `Element not visible, skipping`);
    return;
  }
  
  DEBUG.log('processing', `Processing element: ${element.nodeName}`);

  // Count text nodes before filtering
  let allTextNodes = 0;
  let acceptedTextNodes = 0;
  
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        allTextNodes++;
        
        const text = node.textContent.trim();
        if (text.length === 0) {
          DEBUG.log('processing', `Empty text node rejected`);
          return NodeFilter.FILTER_REJECT;
        }
        
        // Check if parent has been processed
        const parent = node.parentNode;
        if (parent && (
          CONFIG.excludedElements.includes(parent.nodeName.toLowerCase()) ||
          parent.hasAttribute('data-polyglot-processed') ||
          state.processedElements.has(parent)
        )) {
          if (CONFIG.excludedElements.includes(parent.nodeName.toLowerCase())) {
            DEBUG.log('processing', `Parent element ${parent.nodeName} is excluded`);
          } else if (parent.hasAttribute('data-polyglot-processed')) {
            DEBUG.log('processing', `Parent already processed (attribute)`);
          } else if (state.processedElements.has(parent)) {
            DEBUG.log('processing', `Parent already processed (WeakSet)`);
          }
          return NodeFilter.FILTER_REJECT;
        }
        
        const words = text.split(/\s+/).filter(word => /\w/.test(word));
        if (words.length < 3) {
          DEBUG.log('processing', `Text too short (${words.length} words): "${text}"`);
          return NodeFilter.FILTER_REJECT;
        }
        
        acceptedTextNodes++;
        DEBUG.log('processing', `Text node accepted: "${text.substring(0, 30)}..."`);
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  // Process text nodes
  let processedCount = 0;
  while (walker.nextNode()) {
    processedCount++;
    const textNode = walker.currentNode;
    if (!state.processedNodes.has(textNode)) {
      state.processedNodes.add(textNode);
      
      // Create a placeholder element for intersection observation
      const placeholder = document.createElement('span');
      placeholder.style.display = 'inline';
      placeholder.setAttribute('data-polyglot-placeholder', 'true');
      textNode.parentNode.insertBefore(placeholder, textNode);
      
      // Store the text node for processing when visible
      state.pendingProcessing.set(placeholder, textNode);
      intersectionObserver.observe(placeholder);
      DEBUG.log('observer', `Started observing placeholder for text: "${textNode.textContent.substring(0, 30)}..."`);
    } else {
      DEBUG.log('processing', `Text node already in processedNodes WeakSet`);
    }
  }
  
  DEBUG.log('processing', `Element processing summary - All text nodes: ${allTextNodes}, Accepted: ${acceptedTextNodes}, Processed: ${processedCount}`);
  state.processedElements.add(element);
}

// Add a more aggressive periodic scanner for lazy-loaded content
function setupPeriodicScanner() {
  // Initial delay before starting periodic scanning
  setTimeout(() => {
    DEBUG.log('visibility', 'Starting periodic content scanner');
    
    // Set up a recurring check for new content
    const scanInterval = setInterval(() => {
      // Don't run the scan if the user hasn't scrolled recently
      if (Date.now() - lastScrollTime > 5000) {
        return; // No recent scrolling, skip this scan
      }
      
      DEBUG.log('visibility', 'Running periodic content scan');
      let newlyFoundElements = 0;
      
      // Get all elements matching our targets
      CONFIG.targetElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          // Check if element is unprocessed, visible, and has suitable text content
          if (!state.processedElements.has(element) && 
              !element.hasAttribute('data-polyglot-processed') && 
              DOMUtils.isVisible(element)) {
            
            // Do a quick check if it has enough text content to be worth processing
            const text = element.textContent.trim();
            const words = text.split(/\s+/).filter(word => /\w/.test(word));
            
            if (words.length >= 3) {
              newlyFoundElements++;
              DEBUG.log('visibility', `Scanner found new element: ${element.nodeName} with ${words.length} words`);
              processElement(element);
            }
          }
        });
      });
      
      DEBUG.log('visibility', `Periodic scan found ${newlyFoundElements} new elements`);
      
      // If we keep finding no new elements for a while, reduce scan frequency
      if (newlyFoundElements === 0) {
        scanEmptyCount++;
        if (scanEmptyCount > 10) {
          DEBUG.log('visibility', 'Reducing scan frequency due to lack of new content');
          clearInterval(scanInterval);
          // Set up a less frequent interval
          setInterval(runContentScan, 5000);
        }
      } else {
        scanEmptyCount = 0;
      }
    }, 1000); // Check every second initially
  }, 2000); // Wait 2 seconds after page load before starting
}

// Track when user last scrolled
let lastScrollTime = Date.now();
let scanEmptyCount = 0;

// Update last scroll time whenever user scrolls
window.addEventListener('scroll', () => {
  lastScrollTime = Date.now();
});

// Function to run a content scan
function runContentScan() {
  DEBUG.log('visibility', 'Running content scan');
  let newlyFoundElements = 0;
  
  CONFIG.targetElements.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      if (!state.processedElements.has(element) && DOMUtils.isVisible(element)) {
        newlyFoundElements++;
        processElement(element);
      }
    });
  });
  
  DEBUG.log('visibility', `Content scan found ${newlyFoundElements} new elements`);
}

// Add this function to initialize the enabled state
async function initializeEnabledState() {
  try {
    const settings = await StorageManager.getSettings();
    state.enabled = settings.enabled !== false; // Default to true if not set
    DEBUG.log('initialization', `Extension enabled state: ${state.enabled}`);
  } catch (error) {
    console.error('Error loading enabled state:', error);
    // Default to enabled if there's an error
    state.enabled = true;
  }
}

// Modify initialize function
function initialize() {
  // Get enabled state first
  initializeEnabledState().then(() => {
    // Only continue if extension is enabled
    if (!state.enabled) {
      DEBUG.log('initialization', 'Extension disabled, skipping initialization');
      return;
    }
    
    DEBUG.log('initialization', 'Starting initialization');
    
    const allElements = [];
    CONFIG.targetElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      DEBUG.log('initialization', `Found ${elements.length} elements matching selector: ${selector}`);
      allElements.push(...elements);
    });
    
    DEBUG.log('initialization', `Total elements to process: ${allElements.length}`);
    
    // Process visible elements
    let visibleCount = 0;
    allElements.forEach(element => {
      if (!state.processedElements.has(element) && DOMUtils.isVisible(element)) {
        visibleCount++;
        processElement(element);
      } else if (state.processedElements.has(element)) {
        DEBUG.log('initialization', `Element already processed, skipping`);
      } else if (!DOMUtils.isVisible(element)) {
        DEBUG.log('visibility', `Element not visible: ${element.nodeName}#${element.id || 'no-id'}`);
      }
    });
    
    DEBUG.log('initialization', `Processed ${visibleCount} visible elements`);

    // Modify the DOM mutation observer to process child elements as well
    const domObserver = new MutationObserver(mutations => {
      DEBUG.log('initialization', `DOM mutation detected: ${mutations.length} mutations`);
      let newElements = 0;
      let newChildElements = 0;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Direct match
            if (CONFIG.targetElements.includes(node.nodeName.toLowerCase())) {
              newElements++;
              DEBUG.log('initialization', `New element added: ${node.nodeName}`);
              processElement(node);
            }
            
            // Process child elements that match our target elements
            CONFIG.targetElements.forEach(selector => {
              const childElements = node.querySelectorAll(selector);
              if (childElements.length > 0) {
                DEBUG.log('initialization', `Found ${childElements.length} child ${selector} elements in added node`);
                newChildElements += childElements.length;
                childElements.forEach(element => {
                  if (!state.processedElements.has(element)) {
                    processElement(element);
                  }
                });
              }
            });
          }
        });
      });
      
      DEBUG.log('initialization', `Processed ${newElements} direct new elements and ${newChildElements} child elements from mutations`);
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Add a scroll observer to detect when content becomes visible through scrolling
    window.addEventListener('scroll', debounce(() => {
      DEBUG.log('visibility', 'Scroll event detected, checking for new visible elements');
      
      // Find elements that match our targets and haven't been processed yet
      let newlyVisibleElements = 0;
      
      CONFIG.targetElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          if (!state.processedElements.has(element) && DOMUtils.isVisible(element)) {
            newlyVisibleElements++;
            DEBUG.log('visibility', `Found newly visible element on scroll: ${element.nodeName}`);
            processElement(element);
          }
        });
      });
      
      DEBUG.log('visibility', `Processed ${newlyVisibleElements} newly visible elements after scrolling`);
    }, 200));
    
    // Set up the periodic scanner for lazy-loaded content
    setupPeriodicScanner();
    
    DEBUG.log('initialization', 'Initialization complete with enhanced lazy-loading detection');
  });
}

// Start processing
if (document.readyState === 'complete') {
  initialize();
} else {
  window.addEventListener('load', initialize); 
}

// Enhance message listener to handle toggle events
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'reprocessPage') {
    console.log('========== MANUALLY REPROCESSING PAGE ==========');
    
    // Only reprocess if enabled
    if (!state.enabled) {
      console.log('Extension is disabled, not reprocessing');
      sendResponse({ status: 'Extension disabled' });
      return true;
    }
    
    // Count current state
    let pendingCount = 0;
    state.pendingProcessing.forEach((value, key) => {
      pendingCount++;
    });
    
    console.log(`Current state - Pending: ${pendingCount}`);
    
    // Clear state
    state.processedNodes = new WeakSet();
    state.processedElements = new WeakSet();
    state.pendingProcessing = new WeakMap();
    
    // Enable all debug logging for reprocessing
    DEBUG.enabled = true;
    Object.keys(DEBUG.levels).forEach(key => {
      DEBUG.levels[key] = true;
    });
    
    // Reinitialize processing with debugging enabled
    initialize();
    
    // Notify that processing has started
    sendResponse({ status: 'Processing started' });
    return true; // Indicate async response
  }
  
  // Handle the toggle message
  if (message.action === 'toggleExtension') {
    console.log(`Extension ${message.enabled ? 'enabled' : 'disabled'}`);
    state.enabled = message.enabled;
    
    // If enabled and not initialized yet, initialize
    if (state.enabled && document.readyState === 'complete') {
      // Clear previous processing state
      state.processedNodes = new WeakSet();
      state.processedElements = new WeakSet();
      state.pendingProcessing = new WeakMap();
      
      // Start processing
      initialize();
    }
    
    sendResponse({ status: `Extension ${message.enabled ? 'enabled' : 'disabled'}` });
    return true;
  }
});

// Add a debounce utility function
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Tooltip System Implementation
 * 
 * This uses Shadow DOM to create tooltips that are guaranteed to be visible
 * regardless of page styling constraints.
 * 
 * Previous Problems:
 * 1. Tooltips were being hidden by parent elements with overflow:hidden
 * 2. Z-index conflicts caused tooltips to appear behind other elements
 * 3. Page CSS was affecting our tooltip styling
 * 4. Containing blocks with positioning would trap tooltips inside
 * 
 * Shadow DOM Solution:
 * - Creates an isolated DOM tree that's immune to page CSS
 * - Uses fixed positioning and maximum z-index
 * - Positions tooltip relative to viewport, not to parent elements
 * - Cannot be affected by overflow properties
 */
function setupTooltipContainer() {
  // Create a container that will host our shadow DOM
  const tooltipHost = document.createElement('div');
  tooltipHost.id = 'polyglot-tooltip-host';
  
  // Position it at the top layer - this ensures it's above everything
  tooltipHost.style.position = 'fixed';
  tooltipHost.style.top = '0';
  tooltipHost.style.left = '0';
  tooltipHost.style.width = '0';
  tooltipHost.style.height = '0';
  tooltipHost.style.zIndex = '2147483647'; // Maximum z-index value
  tooltipHost.style.pointerEvents = 'none';
  
  // Attach to body instead of near the highlighted text
  document.body.appendChild(tooltipHost);
  
  // Create shadow root - this isolates our styles from the page
  const shadow = tooltipHost.attachShadow({ mode: 'open' });
  
  // Add styles from external CSS file
  const linkElem = document.createElement('link');
  linkElem.setAttribute('rel', 'stylesheet');
  linkElem.setAttribute('href', chrome.runtime.getURL('styles/tooltip.css'));
  shadow.appendChild(linkElem);
  
  // Add tooltip element to shadow DOM
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.id = 'polyglot-tooltip';
  tooltip.textContent = '';
  
  shadow.appendChild(tooltip);
  
  // Expose methods to the global scope for use by other components
  window.PolyglotTooltip = {
    show: function(text, x, y) {
      tooltip.textContent = text;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.style.transform = 'translate(-50%, -100%)';
      tooltip.style.opacity = '1';
    },
    hide: function() {
      tooltip.style.opacity = '0';
    }
  };
  
  console.log('Polyglot tooltip container initialized with Shadow DOM');
}

// Call this function at initialization
window.addEventListener('DOMContentLoaded', setupTooltipContainer); 