# Form Populator Extension
A browser extension that helps populate web forms with generated Swedish personal data from [Fejka.nu](https://fejka.nu). Perfect for testing forms and applications that require Swedish personal information.

## Features
- Generate random Swedish personal data including:
  - Names
  - Personal numbers (personnummer)
  - Addresses
  - Phone numbers
  - Email addresses
- Filter generated data by:
  - Age range
  - Gender
- Automatically detect and fill form fields on any webpage
- Save previously generated data for quick reuse
- Clear cached data when needed

## Installation
1. Clone this repository:
   ```
   git clone https://github.com/yourusername/fejka-browser-extension.git
   cd fejka-browser-extension
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   npm run build
   ```
4. Open your browser's extension management page:
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the extension's directory

## Usage
1. Click the extension icon in your browser toolbar to open the popup
2. Optional: Set filters for age range and gender
3. Click "Generate New Person" to get random Swedish personal data
4. Use "Populate Form on Page" to automatically fill out forms on the current webpage
5. Click "Clear Cached Data" to remove saved person data
6. Right-click on any input field to open the context menu with options:
   - **Populate Current Field**: Fill the current field with generated data
   - **Populate All Fields**: Fill all fields on the page with generated data
   - **Generate New & Populate All**: Generate new data and fill all fields on the page

## Development
The extension is built using:
- React for the popup interface
- Webpack for bundling
- Bulma CSS framework for styling
- Font Awesome for icons
- Chrome Extension Manifest V3

To start development:
1. Run `npm install` to install dependencies
2. Run `npm run dev` for development mode with hot-reload
3. Load the extension in your browser as described in the Installation section

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.