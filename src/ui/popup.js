document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    apiKey: document.getElementById('apiKey'),
    languageSetting: document.getElementById('languageSetting'),
    languageLevel: document.getElementById('languageLevel'),
    sliderValue: document.getElementById('sliderValue'),
    promptTokens: document.getElementById('promptTokens'),
    completionTokens: document.getElementById('completionTokens'),
    totalTokens: document.getElementById('totalTokens'),
    estimatedCost: document.getElementById('estimatedCost'),
    enableToggle: document.getElementById('enableToggle'),
    statusText: document.getElementById('statusText')
  };

  // Pricing for GPT-4o mini (per 1M tokens)
  const pricing = {
    promptTokens: 0.15,    // $0.150 per 1M tokens
    completionTokens: 0.60  // $0.600 per 1M tokens
  };

  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }
  
  function calculateCost(stats) {
    // Convert token counts to millions and multiply by price per million
    const promptCost = (stats.promptTokens / 1000000) * pricing.promptTokens;
    const completionCost = (stats.completionTokens / 1000000) * pricing.completionTokens;
    const totalCost = promptCost + completionCost;
    
    // Format as USD with 4 decimal places for small amounts
    const formattedCost = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4 
    }).format(totalCost);
    
    // Split the formatted cost to separate the small decimals
    const costParts = formattedCost.match(/(\$\d+\.\d{2})(\d{2})/);
    
    if (costParts && costParts.length === 3) {
      // Return the main part and the small decimals separately
      return `${costParts[1]}<span class="small-decimals">${costParts[2]}</span>`;
    }
    
    // Fallback to original format if pattern doesn't match
    return formattedCost;
  }

  function updateTokenDisplay(stats) {
    elements.promptTokens.textContent = formatNumber(stats.promptTokens);
    elements.completionTokens.textContent = formatNumber(stats.completionTokens);
    elements.totalTokens.textContent = formatNumber(stats.totalTokens);
    elements.estimatedCost.innerHTML = calculateCost(stats);
  }

  // Listen for token stat updates from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'tokenStatsUpdated') {
      updateTokenDisplay(message.stats);
    }
  });

  function showSaveEffect(element) {
    element.style.backgroundColor = '#e8f0fe';
    setTimeout(() => element.style.backgroundColor = '', 300);
  }

  async function loadSettings() {
    const settings = await StorageManager.getSettings();
    
    // Update settings inputs
    Object.entries(elements).forEach(([key, element]) => {
      if (!settings[key] && settings[key] !== false) {
        // Special handling for the toggle switch - map "enableToggle" to "enabled" property
        if (key === 'enableToggle' && element && element.type === 'checkbox') {
          element.checked = settings.enabled !== false; // Default to true if not set
          if (elements.statusText) {
            elements.statusText.textContent = settings.enabled !== false ? 'Enabled' : 'Disabled';
          }
          return;
        }
        return;
      }
      
      if (element.tagName === 'SELECT') {
        const hasOption = Array.from(element.options).some(opt => opt.value === settings[key]);
        element.value = hasOption ? settings[key] : element.options[0].value;
      } else if (element.type === 'checkbox') {
        element.checked = settings[key];
        // Update the status text
        if (key === 'enableToggle' && elements.statusText) {
          elements.statusText.textContent = settings.enabled ? 'Enabled' : 'Disabled';
        }
      } else if (['promptTokens', 'completionTokens', 'totalTokens', 'estimatedCost', 'statusText'].includes(key)) {
        // Skip token display elements and status text
        return;
      } else {
        element.value = settings[key];
      }
    });

    // Update token display
    updateTokenDisplay(settings.tokenStats);
  }

  // Add listeners and load settings
  Object.entries(elements).forEach(([key, element]) => {
    if (['promptTokens', 'completionTokens', 'totalTokens', 'estimatedCost', 'statusText'].includes(key)) {
      return; // Skip token display elements and status text
    }
    
    if (element.type === 'checkbox') {
      element.addEventListener('change', async () => {
        // For the toggle switch, use the special property 'enabled'
        if (key === 'enableToggle') {
          await StorageManager.updateSetting('enabled', element.checked);
          // Update status text
          elements.statusText.textContent = element.checked ? 'Enabled' : 'Disabled';
          
          // Send message to all tabs to update state
          const tabs = await chrome.tabs.query({});
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'toggleExtension', 
              enabled: element.checked 
            }).catch(() => {
              // Suppress errors for tabs that can't receive messages
            });
          });
        }
        
        showSaveEffect(element.parentNode);
      });
    } else {
      element.addEventListener(
        element.type === 'range' ? 'input' : 'change',
        async () => {
          await StorageManager.updateSetting(key, element.value);
          showSaveEffect(element);
        }
      );
    }
  });

  await loadSettings();

  // Add this in the DOMContentLoaded event handler
  const reprocessButton = document.getElementById('reprocessButton');
  if (reprocessButton) {
    reprocessButton.addEventListener('click', async () => {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        // Send message to the content script
        chrome.tabs.sendMessage(tabs[0].id, { action: 'reprocessPage' });
        // Show feedback
        reprocessButton.textContent = 'Processing...';
        setTimeout(() => {
          reprocessButton.textContent = 'Reprocess Page';
        }, 2000);
      }
    });
  }
}); 