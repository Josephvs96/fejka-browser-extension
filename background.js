chrome.runtime.onInstalled.addListener(() => {});

// Extracted function to fetch and populate data
async function fetchAndPopulateData(params = {}) {
  try {
    // Build the query string from params
    const queryParams = new URLSearchParams({
      json: '1',
      ...params
    }).toString();
    
    const response = await fetch(`https://fejka.nu?${queryParams}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const personData = Array.isArray(data) && data.length > 0 ? data[0] : data;
    return personData;
  } catch (error) {
    throw error;
  }
}

// Extracted function to save data to storage
function saveDataToStorage(personData) {
  chrome.storage.local.set({ 'fejkaPersonData': personData });
}

// Original action click handler - can be kept for toolbar icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const personData = await fetchAndPopulateData({});
    saveDataToStorage(personData);
    
    try {
      chrome.runtime.sendMessage({ 
        action: 'updatePopupData',
        data: personData,
        updateStorage: true
      });
    } catch (error) {
      // Popup is not open, that's fine
    }

    // Update content script in active tab
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'populateForm',
        data: personData
      });
    }
  } catch (error) {
    // Handle error silently
  }
});

// Centralized event listener for handling messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchData') {
    // Return true immediately to indicate we will send a response asynchronously
    fetchAndPopulateData(request.params || {})
      .then(personData => {
        sendResponse({ data: personData });
        saveDataToStorage(personData);
        
        try {
          chrome.runtime.sendMessage({ 
            action: 'updatePopupData',
            data: personData,
            updateStorage: true
          }).catch(() => {
            // Silently handle error if popup is closed
          });
        } catch (error) {
          // Popup is not open, that's fine
        }
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    
    return true; // Keep the message channel open for async response
  }
});