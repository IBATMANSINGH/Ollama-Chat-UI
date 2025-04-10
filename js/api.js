// API URL - can be changed if Ollama is running on a different host/port
const OLLAMA_API_BASE_URL = 'http://localhost:11434';

// Test connection to Ollama API
async function testOllamaConnection() {
    try {
        // Hide welcome container if it exists
        const welcomeContainer = document.querySelector('.welcome-container');
        if (welcomeContainer) {
            welcomeContainer.style.display = 'none';
        }

        // Update status indicator
        updateStatus('Connecting...', 'warning');

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

        // Update status indicator
        updateStatus('Connected', 'success');

        // Show toast notification
        showToast(`Connected to Ollama v${data.version}`, 'success');

        // Now fetch the models
        fetchModels();
    } catch (error) {
        console.error('Error connecting to Ollama:', error);

        // Update status indicator
        updateStatus('Disconnected', 'danger');

        // Show error message in chat
        const errorContainer = addMessageContainer('Error');
        renderMessageContent(errorContainer, `Error connecting to Ollama API at ${OLLAMA_API_BASE_URL}. Make sure Ollama is running and accessible.\n\nError details: ${error.message}`, 'Error');

        // Show toast notification
        showToast('Failed to connect to Ollama', 'error');
    }
}

// Update status indicator
function updateStatus(text, type = 'secondary') {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;

    // Find or create the status text element
    let statusTextElement = statusElement.querySelector('.status-text');
    if (!statusTextElement) {
        statusTextElement = document.createElement('span');
        statusTextElement.classList.add('status-text');
        statusElement.appendChild(statusTextElement);
    }

    // Update the text
    statusTextElement.textContent = text;

    // Remove all status classes
    statusElement.classList.remove('bg-secondary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info');

    // Add appropriate class
    statusElement.classList.add(`bg-${type}`);
}

// Fetch available models from Ollama
async function fetchModels() {
    try {
        updateStatus('Loading models...', 'info');

        const response = await fetch(`${OLLAMA_API_BASE_URL}/api/tags`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Clear existing options
        modelSelect.innerHTML = '';

        // Sort models alphabetically
        const sortedModels = data.models.sort((a, b) => a.name.localeCompare(b.name));

        // Add options for each model
        sortedModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });

        // If we have models, enable the UI
        if (sortedModels.length > 0) {
            updateStatus('Ready', 'success');
            userInput.disabled = false;
            sendButton.disabled = false;

            // Select the first model by default
            if (modelSelect.options.length > 0 && !modelSelect.value) {
                modelSelect.selectedIndex = 0;
            }

            // Show toast notification
            showToast(`Loaded ${sortedModels.length} models`, 'success');
        } else {
            updateStatus('No models found', 'warning');

            // Show message in chat
            const noModelsContainer = addMessageContainer('Error');
            renderMessageContent(noModelsContainer, 'No models found in Ollama. Please pull a model using the Ollama CLI first.', 'Error');

            // Show toast notification
            showToast('No models found', 'warning');
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        updateStatus('Failed to load models', 'danger');

        // Show error message
        const errorContainer = addMessageContainer('Error');
        renderMessageContent(errorContainer, `Failed to fetch models: ${error.message}`, 'Error');

        // Show toast notification
        showToast('Failed to load models', 'error');
    }
}

// Send a message to the Ollama API
async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Get the selected model
    const selectedModel = modelSelect.value;
    if (!selectedModel) {
        showToast('Please select a model first', 'warning');
        return;
    }

    // Clear the input field and reset its height
    userInput.value = '';
    userInput.style.height = 'auto';

    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;

    // Update status
    updateStatus('Generating...', 'primary');

    // Add user message to the UI
    addMessageToChatbox('user', userMessage);

    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    // Save the conversation
    saveConversations();

    // Add assistant message container (empty initially)
    const assistantContainer = addMessageContainer('assistant', selectedModel);

    try {
        // Prepare the request payload
        const payload = {
            model: selectedModel,
            messages: conversationHistory,
            stream: true
        };

        // Add system prompt if available
        const systemPrompt = getSystemPrompt();
        if (systemPrompt) {
            payload.system = systemPrompt;
        }

        // Add generation parameters
        const params = getGenerationParams();
        Object.assign(payload, params);

        // Send the request
        const response = await fetch(`${OLLAMA_API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Process the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    const data = JSON.parse(line);
                    if (data.message && data.message.content) {
                        // Append the new content to the accumulated message
                        assistantMessage += data.message.content;

                        // Update the UI with the current accumulated message
                        if (currentAssistantContentSpan) {
                            // Remove typing indicator if it exists
                            const typingIndicator = currentAssistantContentSpan.querySelector('.typing-indicator');
                            if (typingIndicator) typingIndicator.remove();

                            // Update content
                            renderMessageContent(assistantContainer, assistantMessage, 'assistant');
                        }
                    }
                } catch (e) {
                    console.error('Error parsing JSON from stream:', e);
                }
            }
        }

        // Add the complete assistant message to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Save the updated conversation
        saveConversations();

        // Update status
        updateStatus('Ready', 'success');

    } catch (error) {
        console.error('Error sending message:', error);

        // Show error message
        const errorContainer = addMessageContainer('Error');
        renderMessageContent(errorContainer, `Error: ${error.message}`, 'Error');

        // Show toast notification
        showToast('Failed to generate response', 'error');

        // Update status
        updateStatus('Error', 'danger');
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Get the current system prompt
function getSystemPrompt() {
    const systemPromptInput = document.getElementById('systemPromptInput');
    return systemPromptInput ? systemPromptInput.value.trim() : '';
}

// Get the current generation parameters
function getGenerationParams() {
    const params = {};

    // Temperature
    const temperatureSlider = document.getElementById('temperatureSlider');
    if (temperatureSlider) {
        params.temperature = parseFloat(temperatureSlider.value);
    }

    // Top P
    const topPSlider = document.getElementById('topPSlider');
    if (topPSlider) {
        params.top_p = parseFloat(topPSlider.value);
    }

    // Max tokens
    const maxTokensInput = document.getElementById('maxTokensInput');
    if (maxTokensInput) {
        params.max_tokens = parseInt(maxTokensInput.value);
    }

    return params;
}
