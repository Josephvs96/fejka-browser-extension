# Fejka Browser Extension

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
  - Supports HTML5 autocomplete attributes
  - Smart C/O address detection and handling
  - Intelligent field matching based on IDs, names, labels, and attributes
- Save previously generated data for quick reuse
- Dark/Light theme support
- Clear cached data when needed

## Project Structure

```
├── public/               # Static assets
│   ├── images/          # Extension icons
│   ├── index.html       # Popup HTML template
│   └── popup.dev.html   # Development popup template
├── src/                 # Source code
│   ├── background/      # Chrome extension background script
│   ├── content/         # Content script injected into web pages
│   └── popup/          # React popup application
│       ├── components/  # React components
│       └── styles.css   # Popup styles
├── __mocks__/          # Jest mock files
└── dist/               # Built extension (generated)
```

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Josephvs96/fejka-browser-extension.git
   cd fejka-browser-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Open your browser's extension management page:
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` directory from the built extension

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. Optional: Set filters for age range and gender
3. Click "Generate New Person" to get random Swedish personal data
4. Use "Populate Form on Page" to automatically fill out forms on the current webpage
5. Click "Clear Cached Data" to remove saved person data
6. When focusing on any input field, an icon will appear next to it. Clicking this icon opens a menu with options:
   - **Populate Current Field**: Fill only the current field with relevant data
   - **Populate All Fields**: Fill all fields on the page with the last generated data
   - **Generate New & Populate All**: Generate new data and fill all fields
   - **Choose Field**: Opens a submenu to select specific data to fill (name, email, phone, etc.)

## Development

The extension is built using:
- React 18 for the popup interface
- Webpack 5 for bundling
- Jest for testing
- Bulma CSS framework for styling
- Font Awesome for icons
- Chrome Extension Manifest V3

To start development:
1. Run `npm install` to install dependencies
2. Run `npm run dev` to start the development server with hot-reload at http://localhost:9000
3. Load the extension in your browser as described in the Installation section
4. The popup will automatically connect to the development server for hot-reload

### Testing
The project uses Jest and React Testing Library for unit testing. To run tests:
```bash
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
```

### Building for Production

```bash
npm run build
```

The built extension will be in the `dist` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Fejka.nu](https://fejka.nu) for providing the Swedish personal data generation API
- [Bulma](https://bulma.io/) for the CSS framework
- [Font Awesome](https://fontawesome.com/) for the icons