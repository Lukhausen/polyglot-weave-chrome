document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const languageSettingInput = document.getElementById('languageSetting');
    const languageLevelSelect = document.getElementById('languageLevel');
    const sliderInput = document.getElementById('sliderValue');

    // Load saved settings when popup is opened
    loadSettings();

    // Autosave settings when inputs change
    apiKeyInput.addEventListener('input', () => {
        saveSetting('apiKey', apiKeyInput.value);
    });
    languageSettingInput.addEventListener('input', () => {
        saveSetting('language', languageSettingInput.value);
    });
    languageLevelSelect.addEventListener('change', () => {
        saveSetting('languageLevel', languageLevelSelect.value);
    });
    sliderInput.addEventListener('input', () => { // 'input' event for sliders for continuous update
        saveSetting('sliderValue', sliderInput.value);
    });


    async function loadSettings() {
        const settings = await getSettings();
        console.log("Loaded settings from storage:", settings);
        if (settings && settings.apiKey) {
            apiKeyInput.value = settings.apiKey;
        }
        if (settings && settings.language) {
            languageSettingInput.value = settings.language;
        }
        if (settings && settings.languageLevel) {
            languageLevelSelect.value = settings.languageLevel;
        }
        if (settings && settings.sliderValue) {
            sliderInput.value = settings.sliderValue;
        }
    }

    async function saveSetting(key, value) {
        let settings = await getSettings();
        settings[key] = value; // Update the specific setting
        await setSettings(settings);
        console.log(`Saved ${key} to storage:`, value);
        // Send message to content script to update settings (if needed)
        chrome.scripting.executeScript({
            target: { tabId: await getCurrentTabId() },
            function: (updatedKey) => {
                console.log(`Setting ${updatedKey} updated in content script (placeholder function)`, updatedKey);
                // Here you could have a function in content.js that reacts to setting changes.
                // For example: updateContentScriptSettings(updatedSettings);
            },
            args: [key] // Pass the key that was updated so content script knows what changed
        });
    }


    async function getCurrentTabId() {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        return tab.id;
    }
}); 