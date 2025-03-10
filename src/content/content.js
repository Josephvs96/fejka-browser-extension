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
    margin-left: 8px;
  }
  .fejka-input-icon:hover {
    opacity: 1 !important;
  }
  .fejka-context-menu {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    padding: 4px 0;
    z-index: 999999;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
  }
  .fejka-context-menu.active {
    opacity: 1;
    visibility: visible;
  }
  .fejka-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    white-space: nowrap;
    font-size: 14px;
    color: #333;
    transition: background-color 0.15s ease;
  }
  .fejka-menu-item:hover {
    background-color: #f0f0f0;
  }
  .fejka-submenu {
    position: relative;
    padding-right: 24px;
  }
  .fejka-submenu::after {
    content: '▶';
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
  }
  .fejka-submenu-content {
    position: absolute;
    left: 100%;
    top: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
    padding: 4px 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
    min-width: 150px;
    margin-left: -1px;
  }
  .fejka-submenu:hover .fejka-submenu-content,
  .fejka-submenu-content.active {
    opacity: 1;
    visibility: visible;
  }
`;
document.head.appendChild(styleSheet);

const contextMenu = document.createElement('div');
contextMenu.className = 'fejka-context-menu';
contextMenu.innerHTML = `
  <div class="fejka-menu-item" data-action="populate-current">Populate Current Field</div>
  <div class="fejka-menu-item" data-action="populate-all">Populate All Fields</div>
  <div class="fejka-menu-item" data-action="generate-populate">Generate New & Populate All</div>
   <div class="fejka-menu-item fejka-submenu" data-action="choose-field">
    Choose Field
    <div class="fejka-submenu-content">
      <div class="fejka-menu-item" data-field="name">Full Name</div>
      <div class="fejka-menu-item" data-field="fname">First Name</div>
      <div class="fejka-menu-item" data-field="lname">Last Name</div>
      <div class="fejka-menu-item" data-field="email">Email</div>
      <div class="fejka-menu-item" data-field="phone">Phone</div>
      <div class="fejka-menu-item" data-field="pnr">Personal Number</div>
      <div class="fejka-menu-item" data-field="street">Street</div>
      <div class="fejka-menu-item" data-field="city">City</div>
      <div class="fejka-menu-item" data-field="zip">Zip Code</div>
      <div class="fejka-menu-item" data-field="address">Full Address</div>
      <div class="fejka-menu-item" data-field="age">Age</div>
      <div class="fejka-menu-item" data-field="gender">Gender</div>
    </div>
  </div>
`;

document.body.appendChild(contextMenu);

function createAndUpdateIconPosition(field, icon) {
  const updateIconPosition = () => {
    const inputRect = field.getBoundingClientRect(); 
    if (inputRect.width === 0 || inputRect.height === 0) {
      icon.style.display = 'none';
      return;
    }
    icon.style.top = `${inputRect.top + (inputRect.height - 16) / 2}px`;
    icon.style.left = `${inputRect.right + 4}px`; // Position 4px to the right of the input
    icon.style.display = 'block';
  };

  document.addEventListener('scroll', updateIconPosition, true);
  window.addEventListener('resize', updateIconPosition);
  
  const layoutObserver = new MutationObserver(updateIconPosition);
  layoutObserver.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
  });

  return updateIconPosition;
}

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

function addIconToInput(field) {
  // Skip if already processed or not visible
  if (field.dataset.fejkaProcessed ||
    field.type === 'hidden' ||
    field.style.display === 'none' ||
    field.style.visibility === 'hidden' ||
    ['submit', 'button', 'reset', 'image', 'file', 'hidden'].includes(field.type)) {
    return;
  }

  const rect = field.getBoundingClientRect();
  if (rect.width < 50 || rect.height < 20) {
    return;
  }

  field.dataset.fejkaProcessed = 'true';

  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('images/icon16.png');
  icon.className = 'fejka-input-icon';
  icon.title = 'Generate fake data';

  const updateIconPosition = createAndUpdateIconPosition(field, icon);

  addFieldEventListeners(field, icon, updateIconPosition);

  updateIconPosition();

  icon.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.target.getBoundingClientRect();
    contextMenu.style.top = `${rect.bottom}px`;
    contextMenu.style.left = `${rect.left}px`;
    contextMenu.classList.add('active');
    contextMenu.dataset.currentField = field.id || field.name || '';
  });
}

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

function populateSingleField(field, data) {
  const identifiers = [
    field.id?.toLowerCase(),
    field.name?.toLowerCase(),
    field.getAttribute('data-field')?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.getAttribute('aria-label')?.toLowerCase(),
    field.getAttribute('blazor:bindings')?.toLowerCase(),
    field.getAttribute('_bl_')?.toLowerCase(),
  ].filter(Boolean);

  // Handle both autocomplete attribute variations
  const autoComplete = field.getAttribute('autocomplete') || field.getAttribute('auto-complete');

  // Check for C/O address variations
  const coPatterns = [
    /\bc\.?o\.?/i,      // matches c.o., co., c.o, co
    /\bc\s*\/\s*o\b/i,  // matches c/o, c / o
    /\bco[-\s]?addr/i,  // matches co-address, coaddress, co address
    /care\s+of\b/i      // matches "care of"
  ];

  // Check if any identifier contains C/O patterns
  const isCoAddress = identifiers.some(identifier => {
    if (!identifier) return false;
    return coPatterns.some(pattern => pattern.test(identifier));
  });

  // If it's a C/O field, don't populate it
  if (isCoAddress) {
    return false;
  }

  const labels = document.querySelectorAll(`label[for="${field.id}"]`);
  if (labels.length > 0) {
    identifiers.push(labels[0].textContent.toLowerCase().trim());
  }

  let matched = false;

  // Check autocomplete attribute first
  if (autoComplete === 'street-address' && data.street) {
    matched = setFieldValue(field, data.street);
    if (matched) return matched;
  }

  // Rest of the function remains the same
  if (field.type === 'email' && data.email) {
    matched = setFieldValue(field, data.email);
  } else if (field.type === 'tel' && data.phone) {
    matched = setFieldValue(field, data.phone);
  } else {
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
        'street-address': () => data.street,
        'address-line1': () => data.street,
        'city': () => data.city,
        'address-level2': () => data.city,
        'zip': () => data.zip,
        'postal': () => data.zip,
        'postal-code': () => data.zip,
        'gender': () => data.gender,
        'sex': () => data.gender,
        'phone': () => data.phone,
        'tel': () => data.phone,
        'email': () => data.email,
        'pnr': () => data.pnr,
        'ssn': () => data.pnr,
        'socialsecuritynumber': () => data.pnr,
        'personnummer': () => data.pnr,
        'personal': () => data.pnr,
        'age': () => data.age,
        'address': () => data.address
      };

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

observer.observe(document.body, {
  childList: true,
  subtree: true
});

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

let activeSubMenu = null;
let menuHideTimeout;
let submenuHideTimeout;

document.addEventListener('click', (e) => {
  if (!e.target.closest('.fejka-context-menu') && !e.target.closest('.fejka-input-icon')) {
    clearTimeout(menuHideTimeout);
    contextMenu.classList.remove('active');
    if (activeSubMenu) {
      activeSubMenu.classList.remove('active');
      activeSubMenu = null;
    }
  }
});

const subMenu = contextMenu.querySelector('.fejka-submenu');
const subMenuContent = subMenu.querySelector('.fejka-submenu-content');

function positionSubmenu() {
  const rect = subMenuContent.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check if submenu would go outside viewport on the right
  if (rect.right > viewportWidth) {
    subMenuContent.style.left = 'auto';
    subMenuContent.style.right = '100%';
    subMenuContent.style.marginLeft = '0';
    subMenuContent.style.marginRight = '-1px';
  } else {
    subMenuContent.style.left = '100%';
    subMenuContent.style.right = 'auto';
    subMenuContent.style.marginLeft = '-1px';
    subMenuContent.style.marginRight = '0';
  }

  // Check if submenu would go outside viewport on the bottom
  if (rect.bottom > viewportHeight) {
    const overflowAmount = rect.bottom - viewportHeight;
    subMenuContent.style.top = `${-overflowAmount}px`;
  }
}

subMenu.addEventListener('mouseenter', () => {
  clearTimeout(submenuHideTimeout);
  positionSubmenu();
  subMenuContent.classList.add('active');
  activeSubMenu = subMenuContent;
});

subMenu.addEventListener('mouseleave', (e) => {
  const rect = subMenuContent.getBoundingClientRect();
  const isOverSubmenu = e.clientX >= rect.left && 
                       e.clientX <= rect.right && 
                       e.clientY >= rect.top && 
                       e.clientY <= rect.bottom;
  
  if (!isOverSubmenu) {
    submenuHideTimeout = setTimeout(() => {
      subMenuContent.classList.remove('active');
      activeSubMenu = null;
    }, 150); // Small delay before hiding
  }
});

subMenuContent.addEventListener('mouseenter', () => {
  clearTimeout(submenuHideTimeout);
  subMenuContent.classList.add('active');
  activeSubMenu = subMenuContent;
});

subMenuContent.addEventListener('mouseleave', () => {
  submenuHideTimeout = setTimeout(() => {
    subMenuContent.classList.remove('active');
    activeSubMenu = null;
  }, 150); // Small delay before hiding
});

contextMenu.addEventListener('click', (e) => {
  const menuItem = e.target.closest('.fejka-menu-item');
  if (!menuItem || menuItem.classList.contains('fejka-submenu')) return;
  
  const fieldType = menuItem.dataset.field;
  const action = menuItem.dataset.action;
  
  if (fieldType) {
    contextMenu.classList.remove('active');
    chrome.storage.local.get('fejkaPersonData', (result) => {
      const field = document.querySelector(`#${contextMenu.dataset.currentField}`) ||
        document.querySelector(`[name="${contextMenu.dataset.currentField}"]`);
      
      if (result.fejkaPersonData && field) {
        setFieldValue(field, result.fejkaPersonData[fieldType]);
      } else {
        chrome.runtime.sendMessage({
          action: 'fetchData',
          params: {}
        }, (response) => {
          if (response && response.data && field) {
            const personData = response.data;
            chrome.storage.local.set({ 'fejkaPersonData': personData });
            setFieldValue(field, personData[fieldType]);
          }
        });
      }
    });
    return;
  }

  // Handle other menu actions
  if (action) {
    contextMenu.classList.remove('active');
    switch(action) {
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
                });
              }, 0);
            });
          }
        });
        break;
    }
  }
});

function setFieldValue(field, value) {
  if (!field || value === undefined || value === null) {
    return false;
  }

  try {
    field.value = value;

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

    return field.value === value;
  } catch (error) {
    return false;
  }
}