// --- Add a message container to the chatbox ---
function addMessageContainer(sender, modelName = '') {
    // Hide welcome container if it exists
    const welcomeContainer = document.querySelector('.welcome-container');
    if (welcomeContainer) {
        welcomeContainer.style.display = 'none';
    }

    // Create message container
    const messageRow = document.createElement('div');
    messageRow.classList.add('row', 'mb-4', 'px-3');

    const messageCol = document.createElement('div');
    messageCol.classList.add('col-12');
    messageRow.appendChild(messageCol);

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'p-3');

    if (sender === 'user') {
        messageElement.classList.add('user-message');
        messageCol.classList.add('d-flex', 'justify-content-end');

        // Add user avatar
        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('avatar', 'me-3', 'd-none', 'd-md-flex', 'align-items-end');

        const avatar = document.createElement('div');
        avatar.classList.add('rounded-circle', 'bg-light', 'd-flex', 'align-items-center', 'justify-content-center');
        avatar.style.width = '38px';
        avatar.style.height = '38px';
        avatar.innerHTML = '<i class="bi bi-person text-primary"></i>';

        avatarContainer.appendChild(avatar);
        messageCol.appendChild(avatarContainer);
        messageCol.appendChild(messageElement);
    } else if (sender === 'assistant') {
        messageElement.classList.add('assistant-message');
        messageCol.classList.add('d-flex');

        // Add model badge if provided
        if (modelName) {
            const modelBadge = document.createElement('div');
            modelBadge.classList.add('model-badge', 'badge', 'bg-primary');
            modelBadge.textContent = modelName;
            messageElement.appendChild(modelBadge);
        }

        // Add assistant avatar
        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('avatar', 'me-3', 'd-none', 'd-md-flex', 'align-items-end');

        const avatar = document.createElement('div');
        avatar.classList.add('rounded-circle', 'bg-primary', 'd-flex', 'align-items-center', 'justify-content-center');
        avatar.style.width = '38px';
        avatar.style.height = '38px';
        avatar.innerHTML = '<i class="bi bi-robot text-white"></i>';

        avatarContainer.appendChild(avatar);
        messageCol.appendChild(avatarContainer);

        // Add span for content (initially empty or for streaming text)
        const contentSpan = document.createElement('span');
        messageElement.appendChild(contentSpan);
        currentAssistantContentSpan = contentSpan; // Store reference for streaming

        // Add typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        contentSpan.appendChild(typingIndicator);

        messageCol.appendChild(messageElement);
    } else if (sender === 'Error') {
        messageElement.classList.add('alert', 'alert-danger', 'w-100', 'mx-auto');
        messageCol.appendChild(messageElement);
    }

    // Add animation for smooth appearance
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(10px)';

    chatbox.appendChild(messageRow);

    // Ensure proper scrolling
    ensureProperScrolling();

    // Trigger animation after a small delay
    setTimeout(() => {
        messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';

        // Scroll again after animation to ensure visibility
        ensureProperScrolling();
    }, 10);

    return messageElement;
}

// Function to ensure proper scrolling
function ensureProperScrolling() {
    // Scroll to bottom of chatbox
    if (chatbox) {
        chatbox.scrollTop = chatbox.scrollHeight;
    }
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
         if (streamingSpan) {
             // Remove typing indicator if it exists
             const typingIndicator = streamingSpan.querySelector('.typing-indicator');
             if (typingIndicator) typingIndicator.remove();

             streamingSpan.remove();
         }
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

             // Add language badge if language is specified
             if (language && language !== 'plaintext') {
                 const languageBadge = document.createElement('div');
                 languageBadge.classList.add('language-badge');
                 languageBadge.textContent = language;
                 // Add data-lang attribute for CSS targeting
                 languageBadge.setAttribute('data-lang', language.toLowerCase());
                 wrapper.appendChild(languageBadge);
             }

             // Create a div for CodeMirror to attach to
             const editorDiv = document.createElement('div');
             wrapper.appendChild(editorDiv);

             // Create copy button
             const copyButton = document.createElement('button');
             copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
             copyButton.classList.add('copy-btn', 'btn', 'btn-sm', 'btn-secondary');
             copyButton.title = 'Copy code to clipboard';
             copyButton.addEventListener('click', () => copyCodeToClipboard(code, copyButton));

             // Add data attribute for the language to help with positioning
             if (language && language !== 'plaintext') {
                 copyButton.setAttribute('data-lang', language.toLowerCase());
             }
             wrapper.appendChild(copyButton);

             // Add the wrapper to the container
             container.appendChild(wrapper);

             // Initialize CodeMirror if available
             if (window.CodeMirror) {
                 try {
                     // Map language identifier to CodeMirror language
                     const languageMap = {
                         'js': 'javascript',
                         'javascript': 'javascript',
                         'typescript': 'javascript',
                         'ts': 'javascript',
                         'python': 'python',
                         'py': 'python',
                         'html': 'html',
                         'css': 'css',
                         'json': 'json',
                         'markdown': 'markdown',
                         'md': 'markdown',
                         'sql': 'sql',
                         'java': 'java',
                         'cpp': 'cpp',
                         'c++': 'cpp',
                         'c': 'cpp',
                         'php': 'php',
                         'rust': 'rust'
                     };

                     // Get the appropriate language extension
                     const mappedLanguage = languageMap[language.toLowerCase()] || null;
                     let langExtension = null;

                     if (mappedLanguage && CodeMirror.languages[mappedLanguage]) {
                         langExtension = CodeMirror.languages[mappedLanguage]();
                     }

                     // Create editor state with appropriate extensions
                     const extensions = [
                         CodeMirror.basicSetup,
                         CodeMirror.lineNumbers(),
                         CodeMirror.EditorState.readOnly.of(true)
                     ];

                     // Add language extension if available
                     if (langExtension) {
                         extensions.push(langExtension);
                     }

                     // Add theme extension based on current theme
                     const currentTheme = document.body.getAttribute('data-bs-theme') || 'light';
                     if (currentTheme === 'dark' && CodeMirror.themes.oneDark) {
                         extensions.push(CodeMirror.themes.oneDark);
                     }

                     // Create editor state
                     const state = CodeMirror.EditorState.create({
                         doc: code,
                         extensions: extensions
                     });

                     // Create editor view
                     const editorView = new CodeMirror.EditorView({
                         state: state,
                         parent: editorDiv
                     });

                     // Store editor reference if addEditor function is available
                     if (CodeMirror.addEditor) {
                         CodeMirror.addEditor(editorView);
                     }
                 } catch (error) {
                     console.error('Error initializing CodeMirror:', error);
                     // Fallback to basic code display
                     const pre = document.createElement('pre');
                     pre.textContent = code;
                     editorDiv.appendChild(pre);
                 }
             } else {
                 // Fallback if CodeMirror is not available
                 const pre = document.createElement('pre');
                 pre.textContent = code;
                 editorDiv.appendChild(pre);
             }

             // Skip adding the wrapper again since we already did it above
             lastIndex = codeBlockRegex.lastIndex;
             continue;

             lastIndex = codeBlockRegex.lastIndex;
         }

         // 3. Add any remaining text after the last code block
         if (lastIndex < textContent.length) {
             container.appendChild(document.createTextNode(textContent.substring(lastIndex)));
         }
     }
     ensureProperScrolling(); // Ensure scroll after rendering
}

// --- Copy code to clipboard ---
async function copyCodeToClipboard(code, button) {
    try {
        await navigator.clipboard.writeText(code);

        // Visual feedback
        button.innerHTML = '<i class="bi bi-check"></i> Copied!';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-success');
        button.style.opacity = '1';

        // Show toast notification
        showToast('Code copied to clipboard!', 'success');

        setTimeout(() => {
            button.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            button.classList.remove('btn-success');
            button.classList.add('btn-secondary');
            // Restore opacity after a delay
            setTimeout(() => {
                button.style.opacity = '0.7';
            }, 300);
        }, 2000); // Reset button text after 2 seconds
    } catch (err) {
        console.error('Failed to copy code: ', err);
        button.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-danger');
        button.style.opacity = '1';

        // Show toast notification
        showToast('Failed to copy code', 'error');

        setTimeout(() => {
            button.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            button.classList.remove('btn-danger');
            button.classList.add('btn-secondary');
            // Restore opacity after a delay
            setTimeout(() => {
                button.style.opacity = '0.7';
            }, 300);
        }, 3000); // Longer timeout for error state
    }
}

// --- Show toast notification ---
function showToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Create toast content
    const toastContent = document.createElement('div');
    toastContent.className = 'd-flex';

    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';
    toastBody.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close btn-close-white me-2 m-auto';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');

    toastContent.appendChild(toastBody);
    toastContent.appendChild(closeButton);
    toast.appendChild(toastContent);

    // Add toast to container
    toastContainer.appendChild(toast);

    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('ollama_theme') || 'light';
    applyTheme(savedTheme);

    // Update dark mode switch in settings panel
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (darkModeSwitch) {
        darkModeSwitch.checked = savedTheme === 'dark';

        // Add event listener to the switch
        darkModeSwitch.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }
}

function applyTheme(theme) {
    // Apply theme to body
    document.body.setAttribute('data-bs-theme', theme);
    localStorage.setItem('ollama_theme', theme);

    // Update the dark mode switch in settings
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (darkModeSwitch) {
        darkModeSwitch.checked = theme === 'dark';
    }

    // Update toggle button
    updateThemeToggleButton(theme);

    // Apply specific fixes for dark mode
    if (theme === 'dark') {
        // Fix any specific dark mode issues
        document.querySelectorAll('.card').forEach(card => {
            card.style.backgroundColor = 'var(--bs-card-bg)';
        });
    }

    // Refresh code editors when theme changes
    refreshCodeEditors();
}

// Function to refresh code editors when theme changes
function refreshCodeEditors() {
    // For now, we'll just log that theme has changed
    // In a more complex implementation, we would recreate the editors with the new theme
    console.log('Theme changed - CodeMirror editors would need to be recreated for proper theme switching');

    // We don't reload the page anymore to prevent continuous refreshing
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-bs-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    applyTheme(newTheme);

    // Show toast notification
    showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`, 'info');
}

function updateThemeToggleButton(theme) {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) return;

    const icon = themeToggleBtn.querySelector('i') || document.createElement('i');

    if (!themeToggleBtn.contains(icon)) {
        themeToggleBtn.innerHTML = '';
        themeToggleBtn.appendChild(icon);
    }

    icon.className = theme === 'light' ? 'bi bi-moon-stars' : 'bi bi-sun';
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
    // New Chat button (header)
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewConversation);
    }

    // New Chat button (sidebar)
    const sidebarNewChatBtn = document.getElementById('sidebarNewChatBtn');
    if (sidebarNewChatBtn) {
        sidebarNewChatBtn.addEventListener('click', () => {
            createNewConversation();
            document.getElementById('conversationsSidebar').classList.remove('show');
            document.getElementById('overlay').classList.remove('show');
        });
    }

    // New Chat button (welcome screen)
    const welcomeNewChatBtn = document.getElementById('welcomeNewChatBtn');
    if (welcomeNewChatBtn) {
        welcomeNewChatBtn.addEventListener('click', createNewConversation);
    }

    // Conversations button
    const conversationsBtn = document.getElementById('conversationsBtn');
    if (conversationsBtn) {
        conversationsBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('conversationsSidebar');
            const overlay = document.getElementById('overlay');
            sidebar.classList.toggle('show');
            overlay.classList.toggle('show');
            updateConversationsList();
        });
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const settingsPanel = document.getElementById('settingsPanel');
            const overlay = document.getElementById('overlay');
            settingsPanel.classList.toggle('show');
            overlay.classList.toggle('show');
            updateSettingsUI(); // Ensure UI reflects current settings
        });
    }

    // Close sidebar button
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            document.getElementById('conversationsSidebar').classList.remove('show');
            document.getElementById('overlay').classList.remove('show');
        });
    }

    // Close settings button
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.remove('show');
            document.getElementById('overlay').classList.remove('show');
        });
    }

    // Overlay click to close panels
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            document.getElementById('conversationsSidebar').classList.remove('show');
            document.getElementById('settingsPanel').classList.remove('show');
            overlay.classList.remove('show');
        });
    }

    // Theme toggle button
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Export conversations button
    const exportAllConversationsBtn = document.getElementById('exportAllConversationsBtn');
    if (exportAllConversationsBtn) {
        exportAllConversationsBtn.addEventListener('click', () => {
            exportAllConversations();
            showToast('Conversations exported successfully', 'success');
        });
    }

    // Import conversations button
    const importConversationsBtn = document.getElementById('importConversationsBtn');
    if (importConversationsBtn) {
        importConversationsBtn.addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
    }

    // Import file input change
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        importFileInput.addEventListener('change', importConversations);
    }

    // Send button
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // User input keypress (Enter to send)
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea and update character counter
        userInput.addEventListener('input', () => {
            // Auto-resize
            userInput.style.height = 'auto'; // Temporarily shrink
            const scrollHeight = userInput.scrollHeight;
            const maxHeight = 150; // Max height defined in CSS
            userInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';

            // Update character counter
            updateCharCounter();

            // Get input value and check if it's empty
            const hasContent = userInput.value.trim().length > 0;

            // Show/hide clear button based on input content
            const clearButton = document.getElementById('clearButton');
            if (clearButton) {
                if (hasContent) {
                    clearButton.style.visibility = 'visible';
                    clearButton.style.opacity = '0.6';
                } else {
                    clearButton.style.visibility = 'hidden';
                    clearButton.style.opacity = '0';
                }
            }

            // Enable/disable send button
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                sendButton.disabled = !hasContent;
                sendButton.classList.toggle('opacity-50', !hasContent);
            }

            // Scroll to bottom of chatbox if input gets taller
            if (scrollHeight > 60) {
                ensureProperScrolling();
            }
        });

        // Add focus and blur events for visual feedback
        userInput.addEventListener('focus', () => {
            const inputCard = document.querySelector('.input-card');
            if (inputCard) {
                inputCard.classList.add('shadow-lg');
                inputCard.style.transform = 'translateY(-2px)';
            }
        });

        userInput.addEventListener('blur', () => {
            const inputCard = document.querySelector('.input-card');
            if (inputCard) {
                inputCard.classList.remove('shadow-lg');
                inputCard.style.transform = 'none';
            }
        });

        // Clear button functionality
        const clearButton = document.getElementById('clearButton');
        if (clearButton) {
            // Initially hide the clear button
            clearButton.style.visibility = 'hidden';
            clearButton.style.opacity = '0';

            clearButton.addEventListener('click', () => {
                // Clear the input
                userInput.value = '';
                userInput.style.height = 'auto';

                // Hide the clear button
                clearButton.style.visibility = 'hidden';
                clearButton.style.opacity = '0';

                // Update character counter
                updateCharCounter();

                // Focus the input
                userInput.focus();
            });
        }

        // Initialize input area state
        initInputArea();

        // Focus input on page load
        setTimeout(() => userInput.focus(), 500);

        // Function to update character counter
        function updateCharCounter() {
            const charCounter = document.getElementById('charCounter');
            if (!charCounter) return;

            const count = userInput.value.length;
            charCounter.textContent = count;

            // Reset all classes
            charCounter.classList.remove('text-warning', 'text-danger');

            // Add appropriate class based on count
            if (count > 3000) {
                charCounter.classList.add('text-danger');
            } else if (count > 2000) {
                charCounter.classList.add('text-warning');
            }
        }

        // Function to initialize input area state
        function initInputArea() {
            // Disable send button initially
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                sendButton.disabled = true;
                sendButton.classList.add('opacity-50');
            }

            // Hide clear button initially
            const clearButton = document.getElementById('clearButton');
            if (clearButton) {
                clearButton.style.visibility = 'hidden';
                clearButton.style.opacity = '0';
            }

            // Initialize character counter
            updateCharCounter();
        }
    }
}
