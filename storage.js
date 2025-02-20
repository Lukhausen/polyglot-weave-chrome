// storage.js

async function getWords() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['highlightedWords'], (result) => {
            resolve(result.highlightedWords || []);
        });
    });
}

async function setWords(words) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ highlightedWords: words }, () => {
            resolve();
        });
    });
}

async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['highlightedWords', 'apiKey', 'language', 'languageLevel', 'sliderValue'], (result) => {
            resolve({
                words: result.highlightedWords || [],
                apiKey: result.apiKey || '',
                language: result.language || '',
                languageLevel: result.languageLevel || 'beginner', // default value
                sliderValue: result.sliderValue || '50' // default value
            });
        });
    });
}

async function setSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({
            highlightedWords: settings.words,
            apiKey: settings.apiKey,
            language: settings.language,
            languageLevel: settings.languageLevel,
            sliderValue: settings.sliderValue
        }, () => {
            resolve();
        });
    });
} 