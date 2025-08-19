import React, { useState, useEffect } from 'react';
import Controls from './Controls.jsx';
import PersonData from './PersonData.jsx';

const App = () => {
  const [personData, setPersonData] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      document.body.setAttribute('data-theme', newTheme);
      chrome.storage.local.set({ theme: newTheme });
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    if (chrome?.storage?.local) {
      chrome.storage.local.get(['fejkaPersonData', 'theme'], (result) => {
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message);
          return;
        }
        if (result.fejkaPersonData) {
          setPersonData(result.fejkaPersonData);
        }
        if (result.theme) {
          setTheme(result.theme);
          document.body.setAttribute('data-theme', result.theme);
        }
      });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    chrome.storage.local.set({ theme: newTheme });
  };

  const handleGeneratePerson = (params) => {
    setPersonData(null);
    setError(null);

    try {
      chrome.runtime.sendMessage({
        action: 'fetchData',
        params
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          setError('Failed to generate person data. Please try again.');
          return;
        }

        if (response?.data) {
          setPersonData(response.data);
        } else if (response?.error) {
          setError(response.error);
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to generate person data. Please try again.');
    }
  };

  const handlePopulateForm = () => {
    if (!personData) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        setError('Failed to access current tab.');
        return;
      }

      if (tabs.length === 0) return;

      try {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'populateForm',
          data: personData
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            setError('Failed to communicate with the page. Make sure you\'re on a webpage.');
          }
        });
      } catch (err) {
        console.error('Error sending message to content script:', err);
        setError('Failed to populate form data.');
      }
    });
  };

  const handleClearData = () => {
    setPersonData(null);
    setError(null);
    chrome.storage.local.remove('fejkaPersonData', () => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        setError('Failed to clear data.');
      }
    });
  };

  return (
    <div className="section p-4">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span className="icon">
          <i className={`fas fa-${theme === 'light' ? 'moon' : 'sun'}`}></i>
        </span>
      </button>
      <h4 className="title is-4 has-text-centered mb-4">Fejka Person Data</h4>
      {error && (
        <div className="notification is-danger is-light mb-4">
          {error}
        </div>
      )}
      <div className="box p-2">
        <div className="columns is-mobile is-variable is-2">
          <Controls
            onGenerate={handleGeneratePerson}
            onPopulateForm={handlePopulateForm}
            onClearData={handleClearData}
          />
          <PersonData data={personData} />
        </div>
      </div>
    </div>
  );
};

export default App;
