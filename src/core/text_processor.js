window.TextProcessor = {
  // Track total token usage
  tokenStats: {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  },

  /**
   * Gets current token usage statistics
   * @returns {Object} Token usage stats
   */
  getTokenStats: function() {
    return { ...this.tokenStats };
  },

  /**
   * Processes text based on user settings
   * @param {string} text - The text to process
   * @returns {Promise<string>} Processed text
   */
  processText: async function(text) {
    const settings = await window.StorageManager.getSettings();
    
    try {
      const response = await this.makeOpenAIRequest(text, settings);
      
      // Update token statistics
      if (response.usage) {
        this.tokenStats.promptTokens += response.usage.prompt_tokens || 0;
        this.tokenStats.completionTokens += response.usage.completion_tokens || 0;
        this.tokenStats.totalTokens += response.usage.total_tokens || 0;
        
        // Log token usage
        console.log('Token Usage:', {
          prompt: response.usage.prompt_tokens,
          completion: response.usage.completion_tokens,
          total: response.usage.total_tokens,
          accumulated: this.tokenStats
        });
      }

      // Extract and return the modified text
      if (response.choices?.[0]?.message?.tool_calls?.[0]) {
        const args = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments);
        return args.last_message;
      }
      
      return text;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return text;
    }
  },

  /**
   * Makes the OpenAI API request
   * @private
   */
  makeOpenAIRequest: async function(text, settings) {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [{
            type: "text",
            text: `You will be given a sentence.
Your task is to act as a polyglot weaver.
This means that you will leave most of the text as it is and just replace some words with the corresponding Spanish words.
The target language is ${settings.languageSetting}.
The target level of the Spanish words used is ${settings.languageLevel}. 
You should translate ${settings.sliderValue}% of the incoming text with ${settings.languageSetting} words so that the whole sentence is still understandable in context. 
Select words corresponding to the ${settings.languageLevel} level of ${settings.languageSetting}`
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
          name: "echo_last_message",
          description: "Return the partially replaced Last User Message",
          parameters: {
            type: "object",
            required: ["last_message"],
            properties: {
              last_message: {
                type: "string",
                description: "The last message sent by the user, but with some words replaced"
              }
            },
            additionalProperties: false
          },
          strict: true
        }
      }],
      tool_choice: "required",
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
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
    console.log('Raw API Response Data:', JSON.stringify(data, null, 2));
    
    return data;
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