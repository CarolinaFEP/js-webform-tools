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

function initiateNestedSyncing(options) {
	const { debug = false, 
	fieldLabels = ['• First name', 'Last name', 'What does the caller need?'], 
	syncBack = ['• First name', 'Last name'] } = options;
	const currentHostname = window.location.hostname;

	// Set up event listener to send changes from Form A (parent container) to Form B (nested child)
	try {
		if (debug) {console.log('Setting up an event listener on Form B')};	
		window.addEventListener('message', function (event) {
			if (event.origin === 'https://' + currentHostname) {
				var receivedMessage = event.data;

				try {
					// Parse the received message as JSON
					var jsonMessage = JSON.parse(receivedMessage);

					// Check for a specific key in the JSON message
					if (jsonMessage && jsonMessage.hasFormAField) {
						if (debug) {console.log('Received valid JSON message from Form A:', jsonMessage)};

						// Extract the data from the JSON message
						var labelText = jsonMessage.labelText;
						var inputField = getInputByLabel({debug: debug,labelText: labelText});
						if (debug) {console.log('Frame B found label: ' + labelText)};
						var inputValue = inputField.value;
						if(inputValue != jsonMessage[labelText]) {
							document.getElementById(inputId).value = jsonMessage[labelText];
							if (debug) {console.log('Frame B just filled in the field: ' + jsonMessage.value)};
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
					var responseData = {
							hasFormBField: true,
							labelText: labelText,
							inputFieldValue: inputField.value
						};
						responseData[labelText] = inputField.value;
						if (debug) {console.log('Input field changed. Sending message to Form A:', responseData)};
						window.parent.postMessage(JSON.stringify(responseData), 'https://' + currentHostname);
				}
				inputField.addEventListener('change', function handleInput() {
					// Respond to Form B with a JSON message when input changes
					var responseData = {
						hasFormBField: true,
						labelText: labelText,
						inputFieldValue: inputField.value
					};
					responseData[labelText] = inputField.value;
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
		function sendMessageToFormA() {

			var request = {
				'fieldLabels': fieldLabels
			};
			window.parent.postMessage(JSON.stringify(request), 'https://' + currentHostname);
			if (debug) {console.log('Frame B: Message sent on load: ' + JSON.stringify(request))};
		}
		sendMessageToFormA();        
	} catch (error) {
		console.error('Error handling:', error);
	}
}

function hideFields(fieldLabels) {
	try {
		fieldLabels.forEach(function(labelText) {
			var inputField = getInputByLabel({debug: debug,labelText: labelText});
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
