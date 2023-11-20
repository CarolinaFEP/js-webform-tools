
function getSelectValueByLabel(options) {
	const {labelText = '',
	debug = false} = options;
	var label = Array.from(document.querySelectorAll(`div > label`)).find((l) => l.textContent.replace(/^•\s*/, '') === labelText.replace(/^•\s*/, ''));

	if (debug) {console.log('Looking for label ' + labelText)};		
	if (label) {
		if (debug) {console.log('Found the label ' + labelText)};				
		// Get the parent div of the label
		const labelParentDiv = label.parentElement;
		// Check if the label has a sibling div
		if (labelParentDiv && labelParentDiv.nextElementSibling) {
			// Get the sibling div
			const siblingDiv = labelParentDiv.nextElementSibling;

			// Check if the sibling div has a span child
			const spanChild = siblingDiv.querySelector('span');

			// Check if the span child has a div child
			if (spanChild) {
				const nestedDiv = spanChild.querySelector('div');

				// Check if the nested div has a span child with class 'Select-value-label'
				if (nestedDiv) {
					const selectValueLabelSpan = nestedDiv.querySelector('span.Select-value-label');

					// Return the found span or null if not found
					return selectValueLabelSpan.textContent;
				}
			}
		}
	} 
	if (debug) {console.log('Label not found:', labelText)};
}

function setFieldValue(field, value) {
	field.focus({ preventScroll: true })
	document.execCommand('selectAll',false,null)
	document.execCommand('insertText',false,value)
	field.blur()
}

function getInputByLabel(options) {
	const {labelText = '',
	debug = false} = options;
	var label = Array.from(document.querySelectorAll(`div > label`)).find((l) => l.textContent.replace(/^•\s*/, '') === labelText.replace(/^•\s*/, ''));

	if (debug) {console.log('Looking for label ' + labelText)};		
	if (label) {
		var inputId = label.getAttribute('for');
		var inputField = document.getElementById(inputId);
		if (inputField) {
			return inputField;
		} else {
		if (debug) {console.log('Input element not found for label:', labelText)};
		}
	} else {
		if (debug) {console.log('Label not found:', labelText)};
	}
}

function getInputValueByLabel(options) {
	const {labelText = '',
	debug = false} = options;
	var inputField = getInputByLabel(options);
	return inputField.value;
}

function getFormBLabelByFormALabel(formALabel, labels) {
    // Assuming [fields] is defined in the global scope
    for (const label of labels) {
        if (label.formA === formALabel) {
            return label.formB;
        }
    }
    // Return null if no match is found
    return null;
}

function getFormALabelByFormBLabel(formBLabel, labels) {
    // Assuming [fields] is defined in the global scope
    for (const label of labels) {
        if (label.formB === formBLabel) {
            return label.formA;
        }
    }
    // Return null if no match is found
    return null;
}

function initiateContainerSyncing(options) {
	const { debug = false
	} = options;
	const currentHostname = window.location.hostname;
	try {
        var iframeB = document.getElementById('iframeB');
        var fieldLabels = []; // Initialize an empty array to store field labels

        if (iframeB) {
			if (debug) {console.log('Setting up an event listener on form a')};
            window.addEventListener('message', function (event) {
                if (event.origin === 'https://' + currentHostname) {
                    var receivedMessage = event.data;
                    try {
                        // Parse the received message as JSON
                        var jsonMessage = JSON.parse(receivedMessage);

                        // Check for a specific key in the JSON message
					    // if fieldLabels, this is a subscription operation
                        if (jsonMessage && jsonMessage.fieldLabels) {
                            if (debug) {console.log};('Received field labels from Form B:', jsonMessage.fieldLabels);

                            // Update fieldLabels array with the received labels
                            fieldLabels = jsonMessage.fieldLabels;

                            // Setup input change events based on the received labels
                            fieldLabels.forEach(function(labelText) {
								var inputField = getInputByLabel({debug: debug,labelText: labelText});
								if (inputField) {
									var responseData = {
											hasFormAField: true,
											labelText: labelText,
											inputFieldValue: inputField.value
									};
									if (debug) {console.log};('Input field changed. Sending message to Form B:', responseData);
									iframeB.contentWindow.postMessage(JSON.stringify(responseData), 'https://' + currentHostname);
										
									inputField.addEventListener('change', function handleInput() {
                                            // Respond to Form B with a JSON message when input changes
										var responseData = {
										hasFormAField: true,
										labelText: labelText,
										inputFieldValue: inputField.value
									};
									if (debug) {console.log};('Input field changed. Sending message to Form B:', responseData);
									try {
										iframeB.contentWindow.postMessage(JSON.stringify(responseData), 'https://' + currentHostname);
									} catch (error) {
										inputField.removeEventListener('input', handleInput);
									}
									});
								} else {
									if (debug) {console.log};('Input element not found for label:', labelText);
								}
							});
                        } else if (jsonMessage && jsonMessage.hasFormBField) {
							if (debug) {console.log('Received valid JSON message from Form A:', jsonMessage)};

							// Extract the data from the JSON message
							var labelText = jsonMessage.labelText;

							var inputField = getInputByLabel({debug: debug,labelText: labelText});

							if (inputField) {
								var inputValue = inputField.value;
								if (debug) {console.log('Frame A found label: ' + labelText)};
							    if (debug) {console.log('Current value is: ' + inputValue + ' versus: ' + jsonMessage.inputFieldValue)};
								if(inputValue != jsonMessage.inputFieldValue) {
									var previousFocus = iframeB.contentDocument.activeElement;
									setFieldValue(inputField, jsonMessage.inputFieldValue);
									previousFocus.focus();
									if (debug) {console.log('Frame A just filled in the field: ' + jsonMessage.value)};
								}
							}
						} else {
                            // Handle other messages from Form B
                        }
                    } catch (error) {
                        if (debug) {console.log};('Error parsing JSON:', error);
                    }
                }
            }); // event listener
        } else {
            console.error('iframeB not found.');
        }
    } catch (error) {
        console.error('Error handling:', error);
    }
}

function getFormALabels(labels) {
    // Assuming [fields] is defined in the global scope
    const formALabels = [];

    for (const label of labels) {
        if (label.formA && !formALabels.includes(label.formA)) {
            formALabels.push(label.formA);
        }
    }
    return formALabels;
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

function initiateNestedSyncing(options) {
	const { debug = false, 
	labels = [{'formB' : 'Form First Name','formA' : 'First Name'},{'formB' : 'Form Last Name','formA' : 'Last Name'},{'formB' : 'What does the caller need?','formA' : 'What does the caller need?'}],
	syncBack = ['First name', 'Last name'] } = options;
	const currentHostname = window.location.hostname;

	// Set up event listener to send changes from Form A (parent container) to Form B (nested child)
	try {
		if (debug) {console.log('Setting up an event listener on Form B')};	
		window.addEventListener('message', function (event) {
			if (event.origin === 'https://' + currentHostname) {
				var receivedMessage = event.data;
				if(!isValidJSON(receivedMessage)) {
					return;
				}
				try {
					// Parse the received message as JSON
					var jsonMessage = JSON.parse(receivedMessage);

					// Check for a specific key in the JSON message
					if (jsonMessage && jsonMessage.hasFormAField) {
						if (debug) {console.log('Received valid JSON message from Form A:', jsonMessage)};

						// Extract the data from the JSON message
						var formALabel = jsonMessage.labelText;
						var labelText = getFormBLabelByFormALabel(formALabel, labels);
						var inputField = getInputByLabel({debug: debug,labelText: labelText});
						if (debug) {console.log('Frame B found label: ' + labelText)};
						var inputValue = inputField.value;
						if(inputValue != jsonMessage.inputFieldValue) {
							setFieldValue(inputField, jsonMessage.inputFieldValue);
							if (debug) {console.log('Frame B just filled in the field: ' + jsonMessage.inputFieldValue)};
						}
					} else {
						// if (debug) {console.log('Ignoring message:', receivedMessage)};
					}
				} catch (error) {
					if (debug) {console.log('Error parsing JSON:', error)};
				}
			}
		}); // event listener
	} catch (error) {
		console.error('Error handling:', error);
	}

	// Set up event listener to send changes from Form B (nested child)	to Form A (parent container)
	try{
	   if (debug) {console.log('Setting up field listeners on Form B')};		
	   syncBack.forEach(function(labelText) {
			var inputField = getInputByLabel({debug: debug,labelText: labelText});
			if (inputField) {
				if(inputField.value) {
					var formALabel = getFormALabelByFormBLabel(labelText, labels);
					var responseData = {
							hasFormBField: true,
							labelText: formALabel,
							inputFieldValue: inputField.value
						};
						if (debug) {console.log('Input field changed. Sending message to Form A:', responseData)};
						window.parent.postMessage(JSON.stringify(responseData), 'https://' + currentHostname);
				}
				inputField.addEventListener('change', function handleInput() {
					// Respond to Form B with a JSON message when input changes
					var formALabel = getFormALabelByFormBLabel(labelText, labels);
					var responseData = {
						hasFormBField: true,
						labelText: formALabel,
						inputFieldValue: inputField.value
					};
					if (debug) {console.log('Input field changed. Sending message to Form A:', responseData)};
					try {
						window.parent.postMessage(JSON.stringify(responseData), 'https://' + currentHostname);
					} catch (error) {
						inputField.removeEventListener('input', handleInput);
					}
				});
			} else {
				if (debug) {console.log('Input element not found for label:', labelText)};
			}
		}); // foreach
	} catch (error) {
		console.error('Error handling:', error);
	}

	// Send an initial message to Form A on load
	try {
		var request = {
			'fieldLabels': getFormALabels(labels)
		};
		window.parent.postMessage(JSON.stringify(request), 'https://' + currentHostname);
		if (debug) {console.log('Frame B: Message sent on load: ' + JSON.stringify(request))};
	} catch (error) {
		console.error('Error handling:', error);
	}
}

function hideFields(fieldLabels) {
	try {
		fieldLabels.forEach(function(labelText) {
			var inputField = getInputByLabel({labelText: labelText});
			if (inputField) {
				inputField.parentNode.parentNode.parentNode.style.display = 'none';
			}
		});
	} catch (error) {
	    console.error('Error handling:', error);
    }
}

// Function to load a script from a given URL
function loadScript(url) {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = url;
		script.onload = () => {
			console.log('Script loaded successfully: ' + url);
			resolve();
		};
		script.onerror = () => {
			console.error('Script failed to load: ' + url);
			reject();
		};
		document.head.appendChild(script);
	});
}

function disableAutocomplete() {
    // Get all input elements on the page
    const inputElements = document.querySelectorAll('input');

    // Loop through each input element and set autocomplete to off and add data-lpignore attribute
    inputElements.forEach(input => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('data-lpignore', 'true');
//		input.readOnly = true;
//		input.onfocus = function(){this.removeAttribute('readonly');};
//		input.onblur = function(){this.setAttribute('readonly', true);};
		
    });
}

function removeSubmitButton() {
	// Select all buttons
	var buttons = document.querySelectorAll('button');
		var fieldLabels = ['• First name', 'Last name', 'What does the caller need?'];
	// Iterate through each button
	buttons.forEach(function(button) {
		// Check if the button contains a div
		var div = button.querySelector('div');

		if (div) {
			// Check if the div contains a span with the text Submit
			var span = div.querySelector('span');

			if (span && span.textContent.trim() === 'Submit') {
				// Remove the button
				button.remove();
			}
		}
	});
}

function buildQueryString(json) {
    return Object.keys(json)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(json[key])}`)
        .join('&');
}

function buildQueryStringByLabels(labels) {
    var json = {}
	for (const label of labels) {
		var inputValue = getInputValueByLabel({'labelText':label});
        if (inputValue) {
            json[label] = inputValue;
        }
    }
	return buildQueryString(json);
}

function parseQueryString() {
		const queryString = window.location.search.substring(1);
		const params = new URLSearchParams(queryString);
		const result = {};

		for (const [key, value] of params) {
			result[key] = decodeURIComponent(value);
		}

		return result;
}

function populateValuesFromQueryString(labels) {
	var parsedParams = parseQueryString();
	var interactFieldId = 0;
	var newEvent = new Event('input', { bubbles: true });
	var changeEvent = new Event('change', { bubbles: true });
	for (const label of labels) {
	    if (parsedParams.hasOwnProperty(label) && parsedParams[label]) {	     
			var inputField = getInputByLabel({labelText: label});
			setFieldValue(inputField, parsedParams[label]);
		}
	}
}
