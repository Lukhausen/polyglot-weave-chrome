document.addEventListener('DOMContentLoaded', () => {
    const wordListTextarea = document.getElementById('wordList');
    const saveWordsButton = document.getElementById('saveWords');

    // Load saved words when popup is opened
    loadWords();

    saveWordsButton.addEventListener('click', () => {
        const words = wordListTextarea.value.split(/[\s,]+/); // Split by spaces, commas, or new lines
        saveWords(words);
    });

    async function loadWords() {
        const words = await getWords();
        console.log("Loaded words from storage:", words);
        if (words) {
            wordListTextarea.value = words.join(', ');
        }
    }

    async function saveWords(words) {
        await setWords(words);
        console.log("Saved words to storage:", words);
        // Send message to content script to update highlighting
        chrome.scripting.executeScript({
            target: { tabId: await getCurrentTabId() },
            function: () => {
                applyHighlighting();
            }
        });
    }

    async function getCurrentTabId() {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        return tab.id;
    }
}); 