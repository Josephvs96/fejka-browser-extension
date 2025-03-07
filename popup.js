document.addEventListener('DOMContentLoaded', function () {
  const dataContainer = document.getElementById('data-container');
  const noDataState = document.getElementById('no-data-state');

  // Load saved data from chrome.storage.local when popup opens
  chrome.storage.local.get('fejkaPersonData', function(result) {
    if (result.fejkaPersonData) {
      try {
        displayPersonData(result.fejkaPersonData);
        // Also sync with localStorage for backward compatibility
        localStorage.setItem('fejkaPersonData', JSON.stringify(result.fejkaPersonData));
      } catch (error) {
        updateUI(null); // Show no-data state on error
      }
    } else {
      // Fallback to localStorage for backward compatibility
      const savedData = localStorage.getItem('fejkaPersonData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          displayPersonData(parsedData);
          // Sync with chrome.storage
          chrome.storage.local.set({ 'fejkaPersonData': parsedData });
        } catch (error) {
          updateUI(null); // Show no-data state on error
        }
      } else {
        updateUI(null); // Show no-data state when no data exists
      }
    }
  });

  // Add clear data button handler
  const clearDataButton = document.getElementById('clear-data-button');
  clearDataButton.addEventListener('click', function() {
    // Clear from both storage mechanisms
    chrome.storage.local.remove('fejkaPersonData');
    localStorage.removeItem('fejkaPersonData');
    updateUI(null); // Show no-data state after clearing
  });

  // Add button click handler for generating new data
  const button = document.getElementById('populate-button');
  button.addEventListener('click', function () {
    updateUI(null); // Show loading state

    // Collect form parameters
    const params = {
      age_min: document.getElementById('age-min').value || undefined,
      age_max: document.getElementById('age-max').value || undefined,
      gender: document.getElementById('gender').value || undefined
    };

    // Remove undefined values
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    chrome.runtime.sendMessage({ 
      action: 'fetchData',
      params: params
    }, (response) => {
      if (response && response.data) {
        displayPersonData(response.data);
      } else {
        updateUI(null); // Show no-data state if there was an error
      }
    });
  });

  // Add populate form button click handler
  const populateFormButton = document.getElementById('populate-form-button');
  populateFormButton.addEventListener('click', async function() {
    // Get the current data from the container
    const formData = collectFormData();
    if (!formData) {
      return; // No data to populate
    }
    
    // Get the current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        return;
      }
      
      const activeTab = tabs[0];
      
      // Send message to content script with all the data
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'populateForm',
        data: formData
      });
    });
  });
});

// Collect form data from displayed fields
function collectFormData() {
  const formData = {};
  const dataItems = document.querySelectorAll('.data-item');
  if (dataItems.length === 0) return null;

  dataItems.forEach(item => {
    const label = item.querySelector('.data-label').textContent.replace(':', '').trim();
    const value = item.querySelector('.data-value').textContent;
    const fieldName = label.toLowerCase().replace(/\s+/g, '_');
    formData[fieldName] = value;
  });

  return formData;
}

// Display person data in a unified format
function displayPersonData(data) {
  const dataContainer = document.getElementById('data-container');
  dataContainer.innerHTML = ''; // Clear existing content

  // Create sections for different types of data
  const sections = [
    {
      title: 'Personal Information',
      icon: 'fas fa-user',
      data: {
        name: data.name || `${data.fname || ''} ${data.lname || ''}`.trim(),
        gender: data.gender,
        age: data.age,
        pnr: data.pnr,
        pnr_short: data.pnr_short
      }
    },
    {
      title: 'Contact Information',
      icon: 'fas fa-address-book',
      data: {
        email: data.email,
        phone: data.phone,
        ip: data.ip
      }
    },
    {
      title: 'Address',
      icon: 'fas fa-home',
      data: {
        street: data.street,
        city: data.city,
        zip: data.zip,
        address: data.address
      }
    }
  ];

  // Create and append data items
  sections.forEach(section => {
    const hasData = Object.values(section.data).some(val => val);
    if (!hasData) return;

    // Add section header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'card-header is-flex is-align-items-center mb-2';
    sectionHeader.innerHTML = `
      <span class="icon has-text-white mr-2">
        <i class="${section.icon}"></i>
      </span>
      <span class="card-header-title has-text-weight-semibold">${section.title}</span>
    `;
    dataContainer.appendChild(sectionHeader);

    // Add data items
    Object.entries(section.data).forEach(([key, value]) => {
      if (!value) return;

      const dataItem = document.createElement('div');
      dataItem.className = 'data-item columns is-mobile mb-0 py-1';
      
      const dataLabel = document.createElement('div');
      dataLabel.className = 'data-label column is-two-fifths has-text-weight-medium';
      dataLabel.textContent = formatLabel(key) + ':';
      
      const dataValue = document.createElement('div');
      dataValue.className = 'data-value column';
      dataValue.textContent = value;
      
      dataItem.appendChild(dataLabel);
      dataItem.appendChild(dataValue);
      dataContainer.appendChild(dataItem);
    });

    // Add spacing between sections
    if (sections.indexOf(section) < sections.length - 1) {
      const spacer = document.createElement('div');
      spacer.className = 'my-3';
      dataContainer.appendChild(spacer);
    }
  });

  // Save the data to both storage mechanisms
  localStorage.setItem('fejkaPersonData', JSON.stringify(data));
  chrome.storage.local.set({ 'fejkaPersonData': data });
}

// Handle messages from background script and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if ((request.action === 'populateForm' || request.action === 'updatePopupData') && request.data) {
    try {
      // Handle case where data might still be an array
      const personData = Array.isArray(request.data) && request.data.length > 0
        ? request.data[0]
        : request.data;

      // Always update UI first
      updateUI(personData);

      // Only update storage if flag is set or this is from popup
      if (request.updateStorage || sender.envType === 'extension_popup') {
        localStorage.setItem('fejkaPersonData', JSON.stringify(personData));
        chrome.storage.local.set({ 'fejkaPersonData': personData });
      }
    } catch (error) {
      updateUI(null); // Show no-data state on error
    }
  }
});

// Helper function to format field labels
function formatLabel(label) {
  return label
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function updateUI(data) {
  const container = document.getElementById('data-container');
  const noDataState = document.getElementById('no-data-state');
  
  if (!data || Object.keys(data).length === 0) {
    container.style.display = 'none';
    noDataState.style.display = 'block';
    return;
  }

  noDataState.style.display = 'none';
  container.style.display = 'block';
  displayPersonData(data);
}