# Polyglot Weave Chrome Extension

A Chrome extension that processes text on webpages based on user settings.

## Structure

- `manifest.json` - Extension configuration
- `/src`
  - `/core`
    - `text_processor.js` - Text processing logic
    - `storage.js` - Storage management
  - `/ui`
    - `popup.html` - Settings popup UI
    - `popup.js` - Popup interaction logic
  - `/content`
    - `content.js` - DOM manipulation and observation
    - `dom_utils.js` - DOM utility functions
  - `/background`
    - `background.js` - Background service worker
  - `/utils`
    - `module.js` - Shared utility functions

## Features

- API Key configuration
- Language selection
- Language level setting (beginner/intermediate/advanced)
- Custom processing intensity (0-100 slider)
- Text processing with visibility detection

## Development

1. Clone the repository
2. Load the extension in Chrome:
   - Open chrome://extensions/
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the extension directory
