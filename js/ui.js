// --- Add a message container to the chatbox ---
function addMessageContainer(sender, modelName = '') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'p-3', 'mb-3');

    if (sender === 'user') {
        messageElement.classList.add('user-message', 'bg-primary', 'text-white');
    } else if (sender === 'assistant') {
        messageElement.classList.add('assistant-message', 'bg-light', 'border');
        // Add model label
        const modelLabel = document.createElement('div');
        modelLabel.classList.add('fw-bold', 'mb-2', 'small', 'text-secondary');
        modelLabel.textContent = `${modelName}:`;
        messageElement.appendChild(modelLabel);
        // Add span for content (initially empty or for streaming text)
        const contentSpan = document.createElement('span');
        messageElement.appendChild(contentSpan);
        currentAssistantContentSpan = contentSpan; // Store reference for streaming
    } else if (sender === 'Error') {
        messageElement.classList.add('alert', 'alert-danger', 'w-100');
    }

    // Add animation for smooth appearance
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(10px)';

    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;

    // Trigger animation after a small delay
    setTimeout(() => {
        messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 10);

    return messageElement;
}

// Helper function to add a message to the chatbox
function addMessageToChatbox(sender, text, modelName = '') {
    const container = addMessageContainer(sender, modelName);
    renderMessageContent(container, text, sender);
    return container;
}

// --- Render message content (handling code blocks) ---
function renderMessageContent(container, textContent, sender) {
     if (sender === 'user' || sender === 'Error') {
         // For user and error messages, just set text content directly
         container.appendChild(document.createTextNode(textContent));
     } else if (sender === 'assistant') {
         // For assistant, parse for code blocks
         const codeBlockRegex = /```(?:([\w-]+)\n)?([\s\S]*?)```/g; // Capture language (optional) and content
         let lastIndex = 0;
         let match;

         // Clear the streaming span if it exists
         const streamingSpan = container.querySelector('span');
         if (streamingSpan) streamingSpan.remove();
         currentAssistantContentSpan = null; // Clear reference


         while ((match = codeBlockRegex.exec(textContent)) !== null) {
             // 1. Add text before the code block
             if (match.index > lastIndex) {
                 container.appendChild(document.createTextNode(textContent.substring(lastIndex, match.index)));
             }

             // 2. Add the code block
             const language = match[1] || 'plaintext'; // Language identifier (optional)
             const code = match[2].trim(); // The actual code content

             const wrapper = document.createElement('div');
             wrapper.classList.add('code-block-wrapper', 'my-3');

             const pre = document.createElement('pre');
             const codeElement = document.createElement('code');
             // Optional: Add language class for syntax highlighting libraries
             // codeElement.classList.add(`language-${language}`);
             codeElement.textContent = code;
             pre.appendChild(codeElement);

             const copyButton = document.createElement('button');
             copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
             copyButton.classList.add('copy-btn', 'btn', 'btn-sm', 'btn-secondary');
             copyButton.addEventListener('click', () => copyCodeToClipboard(code, copyButton));

             wrapper.appendChild(pre);
             wrapper.appendChild(copyButton);
             container.appendChild(wrapper);

             lastIndex = codeBlockRegex.lastIndex;
         }

         // 3. Add any remaining text after the last code block
         if (lastIndex < textContent.length) {
             container.appendChild(document.createTextNode(textContent.substring(lastIndex)));
         }
     }
     chatbox.scrollTop = chatbox.scrollHeight; // Ensure scroll after rendering
}

// --- Copy code to clipboard ---
async function copyCodeToClipboard(code, button) {
    try {
        await navigator.clipboard.writeText(code);
        button.innerHTML = '<i class="bi bi-check"></i> Copied!';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-success');
        setTimeout(() => {
            button.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            button.classList.remove('btn-success');
            button.classList.add('btn-secondary');
        }, 1500); // Reset button text after 1.5 seconds
    } catch (err) {
        console.error('Failed to copy code: ', err);
        button.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-danger');
        setTimeout(() => {
            button.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            button.classList.remove('btn-danger');
            button.classList.add('btn-secondary');
        }, 1500);
    }
}

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('ollama_theme') || 'light';
    document.body.setAttribute('data-bs-theme', savedTheme);
    updateThemeToggleButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-bs-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('ollama_theme', newTheme);

    updateThemeToggleButton(newTheme);
}

function updateThemeToggleButton(theme) {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const icon = themeToggleBtn.querySelector('i') || document.createElement('i');

    if (!themeToggleBtn.contains(icon)) {
        themeToggleBtn.innerHTML = '';
        themeToggleBtn.appendChild(icon);
    }

    icon.className = theme === 'light' ? 'bi bi-moon' : 'bi bi-sun';
    themeToggleBtn.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
}

// --- Settings Management ---
function initSettings() {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('ollama_model_settings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            modelSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };
        } catch (e) {
            console.error('Error parsing saved settings:', e);
            modelSettings = { ...DEFAULT_SETTINGS };
        }
    } else {
        modelSettings = { ...DEFAULT_SETTINGS };
    }

    // Initialize settings UI
    updateSettingsUI();

    // Add event listeners for settings controls
    setupSettingsEventListeners();
}

function updateSettingsUI() {
    // Update UI elements with current settings values
    document.getElementById('temperatureSlider').value = modelSettings.temperature;
    document.getElementById('temperatureValue').textContent = modelSettings.temperature;

    document.getElementById('topPSlider').value = modelSettings.top_p;
    document.getElementById('topPValue').textContent = modelSettings.top_p;

    document.getElementById('maxTokensInput').value = modelSettings.max_tokens;
    document.getElementById('systemPromptInput').value = modelSettings.system_prompt || '';
}

function saveSettings() {
    // Get values from UI
    modelSettings.temperature = parseFloat(document.getElementById('temperatureSlider').value);
    modelSettings.top_p = parseFloat(document.getElementById('topPSlider').value);
    modelSettings.max_tokens = parseInt(document.getElementById('maxTokensInput').value);
    modelSettings.system_prompt = document.getElementById('systemPromptInput').value;

    // Save to localStorage
    localStorage.setItem('ollama_model_settings', JSON.stringify(modelSettings));

    // Close settings panel
    document.getElementById('settingsPanel').classList.add('hidden');
}

function resetSettings() {
    // Reset to defaults
    modelSettings = { ...DEFAULT_SETTINGS };
    updateSettingsUI();

    // Save to localStorage
    localStorage.setItem('ollama_model_settings', JSON.stringify(modelSettings));
}

function setupSettingsEventListeners() {
    // Temperature slider
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    temperatureSlider.addEventListener('input', () => {
        temperatureValue.textContent = temperatureSlider.value;
    });

    // Top P slider
    const topPSlider = document.getElementById('topPSlider');
    const topPValue = document.getElementById('topPValue');
    topPSlider.addEventListener('input', () => {
        topPValue.textContent = topPSlider.value;
    });

    // Save settings button
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

    // Reset settings button
    document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);
}

// --- Event Listeners for UI Controls ---
function setupEventListeners() {
    // New Chat button
    document.getElementById('newChatBtn').addEventListener('click', createNewConversation);

    // Conversations button
    document.getElementById('conversationsBtn').addEventListener('click', () => {
        const sidebar = document.getElementById('conversationsSidebar');
        sidebar.classList.toggle('show');
        updateConversationsList();
    });

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
        const settingsPanel = document.getElementById('settingsPanel');
        settingsPanel.classList.toggle('show');
        updateSettingsUI(); // Ensure UI reflects current settings
    });

    // Close sidebar button
    document.getElementById('closeSidebarBtn').addEventListener('click', () => {
        document.getElementById('conversationsSidebar').classList.remove('show');
    });

    // Close settings button
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.remove('show');
    });

    // Theme toggle button
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Export conversations button
    document.getElementById('exportAllConversationsBtn').addEventListener('click', exportAllConversations);

    // Import conversations button
    document.getElementById('importConversationsBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    // Import file input change
    document.getElementById('importFileInput').addEventListener('change', importConversations);

    // Send button
    document.getElementById('sendButton').addEventListener('click', sendMessage);

    // User input keypress (Enter to send)
    document.getElementById('userInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    document.getElementById('userInput').addEventListener('input', () => {
        userInput.style.height = 'auto'; // Temporarily shrink
        const scrollHeight = userInput.scrollHeight;
        const maxHeight = 150; // Max height defined in CSS
        userInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    });
}
