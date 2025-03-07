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
  }
  .fejka-input-icon:hover {
    opacity: 1 !important;
  }
  .fejka-input-wrapper {
    position: static !important;
    display: contents !important;
  }
`;
document.head.appendChild(styleSheet);

// Function to wrap input in a container and add icon
function addIconToInput(field) {
  // Skip if already processed or not visible
  if (field.closest('.fejka-input-wrapper') || 
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

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'fejka-input-wrapper';

  // Create icon
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('images/icon16.png');
  icon.className = 'fejka-input-icon';
  icon.title = 'Generate fake data';

  // Position icon relative to input
  const updateIconPosition = () => {
    const inputRect = field.getBoundingClientRect();
    icon.style.top = inputRect.top + (inputRect.height - 16) / 2 + 'px';
    icon.style.left = inputRect.right - 24 + 'px';
  };

  // Update icon position on scroll and resize
  document.addEventListener('scroll', updateIconPosition, true);
  window.addEventListener('resize', updateIconPosition);

  // Show/hide icon based on input focus
  field.addEventListener('focus', () => {
    updateIconPosition();
    icon.style.opacity = '0.6';
  });

  field.addEventListener('blur', () => {
    icon.style.opacity = '0';
  });

  // Move the field into the wrapper and add icon to document body
  field.parentNode.insertBefore(wrapper, field);
  wrapper.appendChild(field);
  document.body.appendChild(icon);

  // Initial position update
  updateIconPosition();

  // Add click handler to icon
  icon.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Show loading state
    icon.style.opacity = '0.3';

    // Request data from background script
    chrome.runtime.sendMessage({ 
      action: 'fetchData',
      params: {}
    }, (response) => {
      // Reset icon state
      icon.style.opacity = '0.6';

      if (response && response.data) {
        // Update storage and populate field
        chrome.storage.local.set({ 'fejkaPersonData': response.data });
        try {
          chrome.runtime.sendMessage({
            action: 'updatePopupData',
            data: response.data,
            updateStorage: true
          });
        } catch (error) {
          console.log('Could not update popup (probably not open)');
        }
        populateSingleField(field, response.data);
      }
    });
  });
}

// Function to populate a single field with relevant data
function populateSingleField(field, data) {
  const identifiers = [
    field.id?.toLowerCase(),
    field.name?.toLowerCase(),
    field.getAttribute('data-field')?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.getAttribute('aria-label')?.toLowerCase(),
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

      const fieldMatches = {
        'name': () => data.name,
        'firstname': () => data.fname || (data.name ? data.name.split(' ')[0] : null),
        'lastname': () => data.lname || (data.name ? data.name.split(' ').slice(-1)[0] : null),
        'street': () => data.street,
        'city': () => data.city,
        'zip': () => data.zip,
        'postal': () => data.zip,
        'gender': () => data.gender,
        'phone': () => data.phone,
        'email': () => data.email,
        'pnr': () => data.pnr,
        'ssn': () => data.pnr, // Add SSN mapping
        'socialsecuritynumber': () => data.pnr, // Add Social Security Number mapping
        'personnummer': () => data.pnr, // Add Swedish Personal Number mapping
        'personal': () => data.pnr, // Add another common variation
        'age': () => data.age,
        'address': () => data.address
      };

      // First try exact matches
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
    const data = message.data;
    let fieldsPopulated = 0;
    
    // Find input fields and try to match them intelligently with our data
    const inputFields = document.querySelectorAll('input, textarea, select');
    
    inputFields.forEach(field => {
      // Skip submit buttons, hidden fields, etc.
      if (['submit', 'button', 'reset', 'image', 'file', 'hidden'].includes(field.type)) {
        return;
      }
      
      // Try to identify the field purpose based on various attributes
      let identifiers = [
        field.id?.toLowerCase(),
        field.name?.toLowerCase(),
        field.getAttribute('data-field')?.toLowerCase(),
        field.placeholder?.toLowerCase(),
        field.getAttribute('aria-label')?.toLowerCase(),
        // Add Blazor-specific attributes
        field.getAttribute('blazor:bindings')?.toLowerCase(),
        field.getAttribute('_bl_')?.toLowerCase()
      ].filter(Boolean); // Remove nulls/undefined
      
      // Add any label text associated with the input
      const labels = document.querySelectorAll(`label[for="${field.id}"]`);
      if (labels.length > 0) {
        identifiers.push(labels[0].textContent.toLowerCase().trim());
      }
      
      // For each field attribute, try to find a match in our data
      let matched = false;
      
      // Special case for email type
      if (field.type === 'email' && data.email) {
        setFieldValue(field, data.email);
        matched = true;
        fieldsPopulated++;
      } 
      // Special case for phone type
      else if ((field.type === 'tel' || field.name?.includes('phone') || field.id?.includes('phone')) && data.phone) {
        setFieldValue(field, data.phone);
        matched = true;
        fieldsPopulated++;
      }
      // Special case for fields containing 'name', but being first name and last name
      else if (!matched && identifiers.some(id => id?.includes('name'))) {
        if (identifiers.some(id => id?.includes('first') || id?.includes('fname'))) {
          if (data.fname) {
            setFieldValue(field, data.fname);
            matched = true;
            fieldsPopulated++;
          } else if (data.name && data.name.includes(' ')) {
            setFieldValue(field, data.name.split(' ')[0]);
            matched = true;
            fieldsPopulated++;
          }
        }
        else if (identifiers.some(id => id?.includes('last') || id?.includes('lname'))) {
          if (data.lname) {
            setFieldValue(field, data.lname);
            matched = true;
            fieldsPopulated++;
          } else if (data.name && data.name.includes(' ')) {
            setFieldValue(field, data.name.split(' ').slice(-1)[0]);
            matched = true;
            fieldsPopulated++;
          }
        }
        else if (data.name) {
          setFieldValue(field, data.name);
          matched = true;
          fieldsPopulated++;
        }
      }
      
      // Try direct matching
      if (!matched) {
        for (const identifier of identifiers) {
          if (!identifier) continue;
          
          for (const [key, value] of Object.entries(data)) {
            // Exact field matches
            if (identifier === key) {
              setFieldValue(field, value);
              matched = true;
              fieldsPopulated++;
              break;
            }
            
            // Partial field matches based on common naming patterns
            const fieldMap = {
              'street': ['street', 'address', 'addr', 'street-address'],
              'city': ['city', 'town', 'locality'],
              'zip': ['zip', 'postal', 'postcode', 'post-code'],
              'gender': ['gender', 'sex'],
              'email': ['email', 'mail', 'e-mail'],
              'phone': ['phone', 'tel', 'telephone', 'mobile', 'cell'],
              'pnr': ['pnr', 'personal-number', 'ssn', 'social', 'id-number'],
              'age': ['age', 'years'],
              'address': ['address', 'addr', 'location']
            };
            
            if (fieldMap[key] && fieldMap[key].some(term => identifier.includes(term))) {
              setFieldValue(field, value);
              matched = true;
              fieldsPopulated++;
              break;
            }
          }
          
          if (matched) break;
        }
      }
    });
    
    // Send response with the count of populated fields
    sendResponse({
      success: true,
      fieldsPopulated: fieldsPopulated
    });
    
    return true; // Keep the message channel open for async response
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