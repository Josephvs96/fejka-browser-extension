chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Original action click handler - can be kept for toolbar icon clicks
chrome.action.onClicked.addListener((tab) => {
  fetchAndPopulateData({});
});

// Function to fetch data and send it to popup
function fetchAndPopulateData(params = {}) {
  // Build the query string from params
  const queryParams = new URLSearchParams({
    json: '1',
    ...params
  }).toString();

  fetch(`https://fejka.nu?${queryParams}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    // Check if data is an array and extract the first item
    const personData = Array.isArray(data) && data.length > 0 ? data[0] : data;
    chrome.runtime.sendMessage({ action: 'populateForm', data: personData });
  })
  .catch(error => console.error('Error fetching data:', error));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchData') {
    // Handle the fetchData request from popup
    console.log('fetchData action received');
    fetchAndPopulateData(request.params || {});
  }
});