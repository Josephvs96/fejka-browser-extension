import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import 'bulma/css/bulma.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.css';

// Mock Chrome API only in development environment
if (import.meta.env.MODE === 'development' && !chrome?.runtime?.id) {
  window.chrome = {
    runtime: {
      id: 'development',
      sendMessage: (message, callback) => {
        console.log('Mock chrome.runtime.sendMessage:', message);
        // Mock response data for development
        if (message.action === 'fetchData') {
          callback({
            data: {
              name: 'John Doe',
              fname: 'John',
              lname: 'Doe',
              email: 'john.doe@example.com',
              phone: '070-123 45 67',
              pnr: '19900101-1234',
              street: 'Test Street 123',
              city: 'Stockholm',
              zip: '12345',
              address: 'Test Street 123, 12345 Stockholm',
              age: '33',
              gender: 'Male'
            }
          });
        }
      },
      onMessage: {
        addListener: () => {}
      }
    },
    storage: {
      local: {
        get: (key, callback) => {
          callback({});
        },
        set: (data, callback) => {
          console.log('Mock chrome.storage.local.set:', data);
          if (callback) callback();
        },
        remove: (keys, callback) => {
          console.log('Mock chrome.storage.local.remove:', keys);
          if (callback) callback();
        }
      }
    }
  };
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
