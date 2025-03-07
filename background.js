chrome.runtime.onInstalled.addListener(() => {});

// Helper function to check if popup is open and save data to extension storage
function saveDataToStorage(personData) {
  // Use chrome storage API instead of trying to access localStorage directly
  chrome.storage.local.set({ 'fejkaPersonData': personData }, function() {
    console.log('Person data saved to extension storage');
  });
}

// Original action click handler - can be kept for toolbar icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const personData = await fetchAndPopulateData({});
    
    // Save data to extension storage regardless of popup state
    saveDataToStorage(personData);
    
    // Try to update any open popup instances
    try {
      chrome.runtime.sendMessage({ 
        action: 'updatePopupData',
        data: personData,
        updateStorage: true
      });
    } catch (error) {
      // Popup is not open, that's fine, we already saved to storage
      console.log('No open popup to update');
    }

    // Update content script in active tab
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'populateForm',
        data: personData
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

// Function to fetch data and send it to popup or content script
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

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchData') {
    fetchAndPopulateData(request.params || {})
      .then(personData => {
        // Send data back to the requesting script
        sendResponse({ data: personData });
        
        // Save data to extension storage
        saveDataToStorage(personData);
        
        // Try to update any open popup instances
        try {
          chrome.runtime.sendMessage({ 
            action: 'updatePopupData',
            data: personData,
            updateStorage: true
          });
        } catch (error) {
          // Popup is not open, that's fine, we already saved to storage
          console.log('No open popup to update');
        }

        // If request came from popup, update content script
        if (sender.envType === 'extension_popup') {
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'populateForm',
                data: personData
              });
            }
          });
        }
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    
    return true; // Keep the message channel open for async response
  }
});