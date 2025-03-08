// Service worker initialization
self.oninstalled = () => {};

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

// Save data to storage
function saveDataToStorage(personData) {
  chrome.storage.local.set({ 'fejkaPersonData': personData });
}

// Manifest V3 action click handler
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const personData = await fetchAndPopulateData({});
    saveDataToStorage(personData);
    
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'populateForm',
        data: personData
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

// Message handling in service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchData') {
    fetchAndPopulateData(request.params || {})
      .then(personData => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        saveDataToStorage(personData);
        sendResponse({ data: personData });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});