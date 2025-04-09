// API URL - can be changed if Ollama is running on a different host/port
const OLLAMA_API_BASE_URL = 'http://localhost:11434';

// Test connection to Ollama API
async function testOllamaConnection() {
    try {
        // Add a message to indicate we're testing the connection
        const testContainer = addMessageContainer('Error');
        renderMessageContent(testContainer, 'Testing connection to Ollama API...', 'Error');
        
        // Try to connect to the Ollama API
        const response = await fetch(`${OLLAMA_API_BASE_URL}/api/version`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Show the version information
        const versionContainer = addMessageContainer('Error');
        renderMessageContent(versionContainer, `Connected to Ollama version: ${data.version}`, 'Error');
        
        // Now fetch the models
        fetchModels();
        
    } catch (error) {
        console.error('Error connecting to Ollama:', error);
        
        // Show a detailed error message
        const errorContainer = addMessageContainer('Error');
        renderMessageContent(errorContainer, `Failed to connect to Ollama at ${OLLAMA_API_BASE_URL}: ${error.message}`, 'Error');
        
        // Add troubleshooting suggestions
        const helpContainer = addMessageContainer('Error');
        
        // Check if the error is related to CORS
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            renderMessageContent(helpContainer,
                'CORS Error Detected: Your browser is blocking access to the Ollama API.\n\n' +
                'To fix this issue:\n' +
                '1. Close any running Ollama instances\n' +
                '2. Run the included "run_ollama_with_cors.bat" file to start Ollama with CORS headers enabled\n' +
                '3. Or manually run this command in your terminal: set OLLAMA_ORIGINS=* && ollama serve\n' +
                '4. Then click the "Retry Connection" button below',
            'Error');
        } else {
            renderMessageContent(helpContainer,
                'Troubleshooting suggestions:\n' +
                '1. Make sure Ollama is installed and running (ollama serve)\n' +
                '2. Check if you can access the Ollama API in your browser: ' + OLLAMA_API_BASE_URL + '/api/version\n' +
                '3. If using a different host/port, update the OLLAMA_API_BASE_URL variable in the code\n' +
                '4. For CORS issues, run Ollama with: OLLAMA_ORIGINS="*" ollama serve',
            'Error');
        }
        
        // Add a retry button
        const retryContainer = addMessageContainer('Error');
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry Connection';
        retryButton.style.padding = '8px 16px';
        retryButton.style.backgroundColor = 'var(--button-bg)';
        retryButton.style.color = 'white';
        retryButton.style.border = 'none';
        retryButton.style.borderRadius = '4px';
        retryButton.style.cursor = 'pointer';
        retryButton.style.marginTop = '10px';
        retryButton.onclick = () => {
            // Clear previous error messages
            chatbox.innerHTML = '';
            testOllamaConnection();
        };
        retryContainer.appendChild(retryButton);
    }
}

// Fetch available models from Ollama
async function fetchModels() {
    statusDiv.textContent = 'Fetching models...';
    sendButton.disabled = true;
    try {
        console.log(`Attempting to fetch models from ${OLLAMA_API_BASE_URL}/api/tags`);
        
        // Add a debug message to the UI
        const debugContainer = addMessageContainer('Error');
        renderMessageContent(debugContainer, `Attempting to connect to Ollama API at ${OLLAMA_API_BASE_URL}...`, 'Error');
        
        const response = await fetch(`${OLLAMA_API_BASE_URL}/api/tags`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received data from Ollama API:', data);
        
        // Add the response to the UI for debugging
        const responseContainer = addMessageContainer('Error');
        renderMessageContent(responseContainer, `Received response from Ollama API: ${JSON.stringify(data, null, 2)}`, 'Error');

        modelSelect.innerHTML = ''; // Clear existing options
        if (data.models && data.models.length > 0) {
            data.models.sort((a, b) => a.name.localeCompare(b.name)).forEach(model => { // Sort models alphabetically
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
            statusDiv.textContent = 'Idle';
            sendButton.disabled = false;
            
            // Set the model selector to the saved model for this conversation if available
            const savedModel = conversations[activeConversationId]?.model;
            if (savedModel) {
                // Find the option with the saved model name
                const modelOption = Array.from(modelSelect.options).find(option => option.value === savedModel);
                if (modelOption) {
                    modelSelect.value = savedModel;
                }
            }
            
            // Add success message
            const successContainer = addMessageContainer('Error');
            renderMessageContent(successContainer, `Successfully loaded ${data.models.length} models.`, 'Error');
        } else {
            addMessageToChatbox('Error', 'No Ollama models found. Run `ollama serve` & pull a model (e.g., `ollama pull llama3`).');
            statusDiv.textContent = 'No models';
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        addMessageToChatbox('Error', `Failed to fetch models. Is Ollama running at ${OLLAMA_API_BASE_URL}? Error: ${error.message}`);
        statusDiv.textContent = 'Fetch Error';
        
        // Add a more detailed error message
        const errorContainer = addMessageContainer('Error');
        renderMessageContent(errorContainer, `Detailed error: ${error.stack || error}`, 'Error');
        
        // Add a suggestion for CORS issues
        const corsContainer = addMessageContainer('Error');
        renderMessageContent(corsContainer, 'If you are seeing CORS errors, try running Ollama with OLLAMA_ORIGINS="*" environment variable: OLLAMA_ORIGINS="*" ollama serve', 'Error');
    }
}

// Send message to Ollama
async function sendMessage() {
    const messageText = userInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!messageText) return;
    if (!selectedModel) {
         const errContainer = addMessageContainer('Error');
         renderMessageContent(errContainer, 'Please select a model first.', 'Error');
         return;
    }

    // Add user message to UI and history
    const userContainer = addMessageContainer('user');
    renderMessageContent(userContainer, messageText, 'user');
    conversationHistory.push({ role: "user", content: messageText });

    userInput.value = '';
    userInput.style.height = 'auto'; // Reset height before calculating new one
    userInput.style.height = '42px'; // Set back to default single line approx height
    userInput.focus();
    sendButton.disabled = true;
    statusDiv.textContent = `Asking ${selectedModel}...`;

    // Prepare and add assistant message structure to UI
    currentAssistantMessageDiv = addMessageContainer('assistant', selectedModel);
    let accumulatedAssistantResponse = ""; // To store full response for history and final render

    // Initialize assistant message in history - will be updated later
    conversationHistory.push({ role: "assistant", content: "" }); // Placeholder

    abortController = new AbortController(); // Allow aborting fetch

    try {
        // Prepare request payload with model settings
        const requestPayload = {
            model: selectedModel,
            messages: conversationHistory.slice(0, -1), // Send history *before* the placeholder
            stream: true,
            options: {
                temperature: modelSettings.temperature,
                top_p: modelSettings.top_p,
                num_predict: modelSettings.max_tokens
            }
        };
        
        // Add system prompt if it exists
        if (modelSettings.system_prompt && modelSettings.system_prompt.trim() !== '') {
            // Add system message at the beginning of the conversation
            requestPayload.messages = [
                { role: 'system', content: modelSettings.system_prompt },
                ...requestPayload.messages
            ];
        }
        
        const response = await fetch(`${OLLAMA_API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
            signal: abortController.signal // Link fetch to abort controller
        });

         if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }

        // --- Handle Streaming Response ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

         while (true) {
            const { done, value } = await reader.read();
            if (done) break; // Exit loop when stream is finished

            const chunk = decoder.decode(value, { stream: true });
            const jsonResponses = chunk.split('\n').filter(line => line.trim() !== '');

            jsonResponses.forEach(jsonResponse => {
                try {
                     const parsedResponse = JSON.parse(jsonResponse);
                     if (parsedResponse.message && parsedResponse.message.content) {
                         const contentPiece = parsedResponse.message.content;
                         accumulatedAssistantResponse += contentPiece;
                         // Update the streaming span's text content
                         if (currentAssistantContentSpan) {
                             currentAssistantContentSpan.textContent += contentPiece;
                             chatbox.scrollTop = chatbox.scrollHeight; // Keep scrolled down
                         }
                    }
                     if (parsedResponse.done && parsedResponse.message?.content === '') {
                        // Official 'done' marker from Ollama for this request often has empty content
                        // console.log("Stream processing for this request marked done by Ollama.");
                     }
                } catch (e) {
                    console.warn("Failed to parse JSON chunk:", jsonResponse, e);
                }
            });
         } // End while loop (stream finished)

        // --- Final Processing after Stream ---
        // Update history with the final accumulated content
         if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === "assistant") {
            conversationHistory[conversationHistory.length - 1].content = accumulatedAssistantResponse;
            // Save the updated conversation to localStorage
            saveConversations();
         }

        // Render the complete message with code block handling
         if (currentAssistantMessageDiv) {
            renderMessageContent(currentAssistantMessageDiv, accumulatedAssistantResponse, 'assistant');
         }

    } catch (error) {
        console.error('Error sending message:', error);
         // Handle fetch cancellation
         if (error.name === 'AbortError') {
             console.log('Fetch aborted.');
             statusDiv.textContent = 'Request Cancelled';
              // Optionally remove the partial assistant message container
             if(currentAssistantMessageDiv) currentAssistantMessageDiv.remove();
              // Remove placeholder from history
              if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === "assistant") {
                  conversationHistory.pop();
              }
             return; // Stop further processing
         }

        // Display error in the UI
         const errorText = `Error: ${error.message}. Check Ollama connection & model availability.`;
         if (currentAssistantMessageDiv) {
             // If we started an assistant message, replace its content with error
             currentAssistantMessageDiv.innerHTML = ''; // Clear existing content (label, span)
             currentAssistantMessageDiv.classList.remove('assistant-message');
             currentAssistantMessageDiv.classList.add('error-message');
             renderMessageContent(currentAssistantMessageDiv, errorText, 'Error');
         } else {
             // Otherwise, add a new error message block
             const errContainer = addMessageContainer('Error');
             renderMessageContent(errContainer, errorText, 'Error');
         }
          // Remove potentially incomplete/placeholder assistant message from history
         if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === "assistant") {
             conversationHistory.pop();
         }

    } finally {
        statusDiv.textContent = 'Idle';
        sendButton.disabled = false;
        currentAssistantMessageDiv = null; // Reset references
        currentAssistantContentSpan = null;
        abortController = null; // Reset controller
        userInput.focus();
    }
}
