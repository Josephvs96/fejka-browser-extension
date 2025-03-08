import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.js';
import 'bulma/css/bulma.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.css';

// Ensure the Chrome extension API is available before rendering
if (chrome?.runtime?.id) {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Chrome extension API not available');
}
