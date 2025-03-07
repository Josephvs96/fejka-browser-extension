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
  // Set the value
  field.value = value;
  
  // Create and dispatch events that Blazor listens for
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  
  // Dispatch events
  field.dispatchEvent(inputEvent);
  field.dispatchEvent(changeEvent);
  
  // If there's a Blazor binding, attempt to trigger Blazor's change detection
  if (field.hasAttribute('blazor:bindings') || field.hasAttribute('_bl_')) {
    // Give Blazor a moment to process the change
    setTimeout(() => {
      field.dispatchEvent(new Event('blur', { bubbles: true }));
    }, 100);
  }
}