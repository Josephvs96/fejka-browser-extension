const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .fejka-input-icon {
    cursor: pointer;
    position: fixed;
    width: 16px;
    height: 16px;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 1000;
    pointer-events: auto;
    margin-left: 8px; /* Add margin to separate from input */
  }
  .fejka-input-icon:hover {
    opacity: 1 !important;
  }
  .fejka-input-wrapper {
    position: static !important;
    display: contents !important;
  }
  .fejka-context-menu {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    padding: 0;
    z-index: 1001;
    display: none;
    overflow: hidden;
  }
  .fejka-context-menu.active {
    display: block;
  }
  .fejka-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    white-space: nowrap;
    font-size: 14px;
    color: #333;
  }
  .fejka-menu-item:hover {
    background-color: #f0f0f0;
  }
`;
document.head.appendChild(styleSheet);

// Add the context menu HTML to the document
const contextMenu = document.createElement('div');
contextMenu.className = 'fejka-context-menu';
contextMenu.innerHTML = `
  <div class="fejka-menu-item" data-action="populate-current">Populate Current Field</div>
  <div class="fejka-menu-item" data-action="populate-all">Populate All Fields</div>
  <div class="fejka-menu-item" data-action="generate-populate">Generate New & Populate All</div>
`;
document.body.appendChild(contextMenu);

// Extracted function to create and update icon position
function createAndUpdateIconPosition(field, icon) {
  const updateIconPosition = () => {
    const inputRect = field.getBoundingClientRect();
    
    // Check if the field is actually visible
    if (inputRect.width === 0 || inputRect.height === 0) {
      icon.style.display = 'none';
      return;
    }

    // Get the computed style of the input
    const computedStyle = window.getComputedStyle(field);
    
    // Position the icon outside the input field
    icon.style.top = `${inputRect.top + (inputRect.height - 16) / 2}px`;
    icon.style.left = `${inputRect.right + 4}px`; // Position 4px to the right of the input
    icon.style.display = 'block';
  };

  // Add scroll event listeners at different levels
  document.addEventListener('scroll', updateIconPosition, true);
  window.addEventListener('resize', updateIconPosition);
  
  // Also update on any DOM mutations that might affect layout
  const layoutObserver = new MutationObserver(updateIconPosition);
  layoutObserver.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
  });

  return updateIconPosition;
}

// Extracted function to add event listeners to the field
function addFieldEventListeners(field, icon, updateIconPosition) {
  field.addEventListener('focus', () => {
    updateIconPosition();
    icon.style.opacity = '0.6';
    document.body.appendChild(icon);
  });

  field.addEventListener('focusout', (event) => {
    setTimeout(() => {
      if (!icon.contains(document.activeElement)) {
        icon.style.opacity = '0';
        document.body.removeChild(icon);
      }
    }, 100);
  });

  icon.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });
}

// Function to handle icon positioning and management for an input
function addIconToInput(field) {
  // Skip if already processed or not visible
  if (field.dataset.fejkaProcessed ||
    field.type === 'hidden' ||
    field.style.display === 'none' ||
    field.style.visibility === 'hidden' ||
    ['submit', 'button', 'reset', 'image', 'file', 'hidden'].includes(field.type)) {
    return;
  }

  // Skip if the field is too small
  const rect = field.getBoundingClientRect();
  if (rect.width < 50 || rect.height < 20) {
    return;
  }

  // Mark field as processed
  field.dataset.fejkaProcessed = 'true';

  // Create icon
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('images/icon16.png');
  icon.className = 'fejka-input-icon';
  icon.title = 'Generate fake data';

  // Create and update icon position
  const updateIconPosition = createAndUpdateIconPosition(field, icon);

  // Add event listeners to the field
  addFieldEventListeners(field, icon, updateIconPosition);

  // Initial position update
  updateIconPosition();

  // Add click handler to icon
  icon.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Position and show the context menu
    const rect = e.target.getBoundingClientRect();
    contextMenu.style.top = rect.bottom + 'px';
    contextMenu.style.left = rect.left + 'px';
    contextMenu.classList.add('active');

    // Store the current field for reference
    contextMenu.dataset.currentField = field.id || field.name || '';
  });
}

// Centralized function to populate all fields
function populateAllFields(data) {
  let fieldsPopulated = 0;
  const inputFields = document.querySelectorAll('input, textarea, select');

  inputFields.forEach(field => {
    if (!['submit', 'button', 'reset', 'image', 'file', 'hidden'].includes(field.type)) {
      if (populateSingleField(field, data)) {
        fieldsPopulated++;
      }
    }
  });

  return fieldsPopulated;
}

// Function to populate a single field with relevant data
function populateSingleField(field, data) {
  const identifiers = [
    field.id?.toLowerCase(),
    field.name?.toLowerCase(),
    field.getAttribute('data-field')?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.getAttribute('aria-label')?.toLowerCase(),
    field.getAttribute('blazor:bindings')?.toLowerCase(),
    field.getAttribute('_bl_')?.toLowerCase()
  ].filter(Boolean);

  // Add label text if exists
  const labels = document.querySelectorAll(`label[for="${field.id}"]`);
  if (labels.length > 0) {
    identifiers.push(labels[0].textContent.toLowerCase().trim());
  }

  let matched = false;

  // Match field with appropriate data
  if (field.type === 'email' && data.email) {
    matched = setFieldValue(field, data.email);
  } else if (field.type === 'tel' && data.phone) {
    matched = setFieldValue(field, data.phone);
  } else {
    // Try to match based on field identifiers
    for (const identifier of identifiers) {
      if (!identifier) continue;

      // Special handling for first/last name fields
      if (identifier.includes('name')) {
        if (identifier.includes('first') || identifier.includes('fname')) {
          if (data.fname) {
            matched = setFieldValue(field, data.fname);
          } else if (data.name && data.name.includes(' ')) {
            matched = setFieldValue(field, data.name.split(' ')[0]);
          }
          if (matched) break;
        }
        else if (identifier.includes('last') || identifier.includes('lname')) {
          if (data.lname) {
            matched = setFieldValue(field, data.lname);
          } else if (data.name && data.name.includes(' ')) {
            matched = setFieldValue(field, data.name.split(' ').slice(-1)[0]);
          }
          if (matched) break;
        }
        else if (data.name) {
          matched = setFieldValue(field, data.name);
          if (matched) break;
        }
        continue;
      }

      const fieldMatches = {
        'street': () => data.street,
        'city': () => data.city,
        'zip': () => data.zip,
        'postal': () => data.zip,
        'gender': () => data.gender,
        'phone': () => data.phone,
        'email': () => data.email,
        'pnr': () => data.pnr,
        'ssn': () => data.pnr,
        'socialsecuritynumber': () => data.pnr,
        'personnummer': () => data.pnr,
        'personal': () => data.pnr,
        'age': () => data.age,
        'address': () => data.address
      };

      // Try exact matches
      for (const [key, getValue] of Object.entries(fieldMatches)) {
        if (identifier === key || identifier.includes(key.toLowerCase())) {
          const value = getValue();
          if (value) {
            matched = setFieldValue(field, value);
            if (matched) break;
          }
        }
      }

      // If no match found, try the placeholder pattern for Swedish personal numbers
      if (!matched && field.placeholder?.match(/^\d{8}-\d{4}$/)) {
        matched = setFieldValue(field, data.pnr);
      }

      if (matched) break;
    }
  }

  return matched;
}

// Add icons to existing inputs when page loads
function addIconsToInputs() {
  const inputFields = document.querySelectorAll('input, textarea, select');
  inputFields.forEach(field => {
    if (!['submit', 'button', 'reset', 'image', 'file', 'hidden'].includes(field.type)) {
      addIconToInput(field);
    }
  });
}

// Watch for dynamically added inputs
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // ELEMENT_NODE
        const inputs = node.querySelectorAll('input, textarea, select');
        inputs.forEach(input => addIconToInput(input));
        if (node.matches('input, textarea, select')) {
          addIconToInput(node);
        }
      }
    });
  });
});

// Start observing the document
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial setup
addIconsToInputs();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'populateForm') {
    const fieldsPopulated = populateAllFields(message.data);
    sendResponse({
      success: true,
      fieldsPopulated: fieldsPopulated
    });
    return true;
  }
});

// Add click handlers for the context menu
document.addEventListener('click', (e) => {
  if (!e.target.closest('.fejka-context-menu') && !e.target.closest('.fejka-input-icon')) {
    contextMenu.classList.remove('active');
  }
});

contextMenu.addEventListener('click', (e) => {
  const menuItem = e.target.closest('.fejka-menu-item');
  if (!menuItem) return;

  const action = menuItem.dataset.action;
  contextMenu.classList.remove('active');

  switch (action) {
    case 'populate-current':
      chrome.storage.local.get('fejkaPersonData', (result) => {
        if (result.fejkaPersonData) {
          const field = document.querySelector(`#${contextMenu.dataset.currentField}`) ||
            document.querySelector(`[name="${contextMenu.dataset.currentField}"]`);
          if (field) {
            populateSingleField(field, result.fejkaPersonData);
          }
        } else {
          chrome.runtime.sendMessage({
            action: 'fetchData',
            params: {}
          }, (response) => {
            if (response && response.data) {
              const personData = response.data;
              const field = document.querySelector(`#${contextMenu.dataset.currentField}`) ||
                document.querySelector(`[name="${contextMenu.dataset.currentField}"]`);
              if (field) {
                populateSingleField(field, personData);
              }
            }
          });
        }
      });
      break;

    case 'populate-all':
      chrome.storage.local.get('fejkaPersonData', (result) => {
        if (result.fejkaPersonData) {
          populateAllFields(result.fejkaPersonData);
        } else {
          chrome.runtime.sendMessage({
            action: 'fetchData',
            params: {}
          }, (response) => {
            if (response && response.data) {
              const personData = response.data;
              populateAllFields(personData);
            }
          });
        }
      });
      break;

    case 'generate-populate':
      chrome.runtime.sendMessage({
        action: 'fetchData',
        params: {}
      }, (response) => {
        if (response && response.data) {
          const personData = response.data;
          chrome.storage.local.set({ 'fejkaPersonData': personData }, () => {
            populateAllFields(personData);

            setTimeout(() => {
              chrome.runtime.sendMessage({
                action: 'updatePopupData',
                data: personData,
                updateStorage: true
              }).catch(() => {
                // Silently handle error if popup is closed
              });
            }, 0);
          });
        }
      });
      break;
  }
});

// Helper function to set field value and trigger necessary events for Blazor
function setFieldValue(field, value) {
  if (!field || value === undefined || value === null) {
    return false;
  }

  try {
    // Store original value to check if it changed
    const originalValue = field.value;

    // Set the value
    field.value = value;

    // Create and dispatch events
    const events = ['input', 'change'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      field.dispatchEvent(event);
    });

    // If there's a Blazor binding, trigger blur event
    if (field.hasAttribute('blazor:bindings') || field.hasAttribute('_bl_')) {
      setTimeout(() => {
        field.dispatchEvent(new Event('blur', { bubbles: true }));
      }, 100);
    }

    // Verify the value was actually set
    return field.value === value;
  } catch (error) {
    return false;
  }
}