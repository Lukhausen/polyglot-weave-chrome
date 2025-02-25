/**
 * TextProcessor
 * Handles text transformation using the OpenAI API
 */
window.TextProcessor = {
  // API model configuration
  API_CONFIG: {
    model: "gpt-4o-mini",
    temperature: 1,
    max_completion_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  },
  
  // Token usage tracking
  tokenStats: {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  },

  /**
   * Gets current token usage statistics
   * @returns {Object} Token usage stats
   */
  getTokenStats() {
    return { ...this.tokenStats };
  },

  /**
   * Updates token statistics and sends update to background
   * @param {Object} usage - Token usage from API
   * @returns {Promise<Object>} Updated stats
   */
  async updateTokenStats(usage) {
    const settings = await window.StorageManager.getSettings();
    const currentStats = settings.tokenStats;
    
    const newStats = {
      promptTokens: (currentStats.promptTokens || 0) + (usage.prompt_tokens || 0),
      completionTokens: (currentStats.completionTokens || 0) + (usage.completion_tokens || 0),
      totalTokens: (currentStats.totalTokens || 0) + (usage.total_tokens || 0)
    };
    
    await window.StorageManager.updateTokenStats(newStats);
    
    // Notify background script about updated token stats
    this.sendTokenStatsUpdate(newStats);
    
    return newStats;
  },
  
  /**
   * Sends token stats update to background script
   * @param {Object} stats - Updated token stats
   */
  sendTokenStatsUpdate(stats) {
    try {
      chrome.runtime.sendMessage({
        type: 'tokenStatsUpdated',
        stats: stats
      }, response => {
        if (chrome.runtime.lastError) {
          // Suppress error - receiver might not be available
          console.log('Stats update sent, but receiver unavailable');
        }
      });
    } catch (error) {
      console.log('Error sending token stats update:', error);
    }
  },

  /**
   * Processes text based on user settings
   * @param {string} text - The text to process
   * @returns {Promise<Object>} Processed text and replacements
   */
  async processText(text) {
    const settings = await window.StorageManager.getSettings();
    
    try {
      const response = await this.makeOpenAIRequest(text, settings);
      
      // Update token statistics
      if (response.usage) {
        await this.updateTokenStats(response.usage);
      }

      // Extract replacements from the tool call
      if (response.choices?.[0]?.message?.tool_calls?.[0]) {
        const toolCall = response.choices[0].message.tool_calls[0];
        const args = JSON.parse(toolCall.function.arguments);
        
        // Apply replacements to the text
        if (args.replacements && Array.isArray(args.replacements)) {
          // Filter out duplicate replacements
          const replacedWords = new Set();
          const uniqueReplacements = args.replacements.filter(item => {
            if (replacedWords.has(item.original)) return false;
            replacedWords.add(item.original);
            return true;
          });
          
          // Apply replacements to the text
          let processedText = text;
          uniqueReplacements.forEach(({ original, replacement }) => {
            const regex = new RegExp(this.escapeRegExp(original), 'g');
            processedText = processedText.replace(regex, replacement);
          });
          
          return {
            text: processedText,
            replacements: uniqueReplacements
          };
        }
      }
      
      // Return unchanged text if no processing was done
      return { text, replacements: [] };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return { text, replacements: [] };
    }
  },

  /**
   * Makes the OpenAI API request
   * @param {string} text - Text to process
   * @param {Object} settings - User settings
   * @returns {Promise<Object>} API response
   */
  async makeOpenAIRequest(text, settings) {
    const payload = {
      model: this.API_CONFIG.model,
      messages: [
        {
          role: "system",
          content: [{
            type: "text",
            text: this.buildSystemPrompt(settings)
          }]
        },
        {
          role: "user",
          content: [{
            type: "text",
            text: text
          }]
        }
      ],
      response_format: { type: "text" },
      tools: [{
        type: "function",
        function: {
          name: "replace_words_phrases",
          description: `Replaces Words or Phrases of the Users Text. Make sure to be aware of the context, Replace only words in ${settings.languageLevel} Level of ${settings.languageSetting}`,
          parameters: {
            type: "object",
            required: ["replacements"],
            properties: {
              replacements: {
                type: "array",
                description: "An array of translations containing original words/phrases and their replacements.",
                items: {
                  type: "object",
                  required: ["original", "replacement"],
                  properties: {
                    original: {
                      type: "string",
                      description: "The word or phrase to be replaced"
                    },
                    replacement: {
                      type: "string",
                      description: "The word or phrase that will replace the original"
                    }
                  },
                  additionalProperties: false
                }
              }
            },
            additionalProperties: false
          },
          strict: true
        }
      }],
      tool_choice: "required",
      temperature: this.API_CONFIG.temperature,
      max_completion_tokens: this.API_CONFIG.max_completion_tokens,
      top_p: this.API_CONFIG.top_p,
      frequency_penalty: this.API_CONFIG.frequency_penalty,
      presence_penalty: this.API_CONFIG.presence_penalty
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log for debugging purposes
    console.log('API Input Text:', text);
    console.log('API Response Data:', JSON.stringify(data, null, 2));
    
    return data;
  },
  
  /**
   * Builds the system prompt based on user settings
   * @param {Object} settings - User settings
   * @returns {string} Formatted system prompt
   */
  buildSystemPrompt(settings) {
    return `You will be given a sentence.
Your task is to act as a polyglot weaver.
This means that you will leave most of the text as it is and just replace some words with the corresponding ${settings.languageSetting} words.
The target language is ${settings.languageSetting}.
The target level of the ${settings.languageSetting} words used is ${settings.languageLevel}. 
You should translate ${settings.sliderValue}% of the incoming text with ${settings.languageSetting} words so that the whole sentence is still understandable in context. 
Select words corresponding to the ${settings.languageLevel} level of ${settings.languageSetting}. Be aware of the context, the words are in to have them with correct Grammar. First translate THe FUll sentence, then pick the word accordingly to the level and then call the function`;
  },

  /**
   * Escapes special characters for use in RegExp
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Applies text processing based on settings
   * @private
   */
  applyProcessing: function(text, settings) {
    // In the future, this could use the API key, language, and level settings
    // to determine how to process the text
    return this.capitalizeAlternateWords(text);
  },

  /**
   * Capitalizes every second word in the text
   * @private
   */
  capitalizeAlternateWords: function(text) {
    return text.split(/\s+/).map((word, index) => {
      return index % 2 === 1 ? word.toUpperCase() : word;
    }).join(' ');
  }
}; 