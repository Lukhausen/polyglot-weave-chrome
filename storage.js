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