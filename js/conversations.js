// Default model settings
const DEFAULT_SETTINGS = {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 4096,
    system_prompt: ''
};

// Conversation management
let activeConversationId = 'default';
let conversations = {};
let conversationHistory = [];
let currentAssistantMessageDiv = null; // Reference to the assistant's outer message div
let currentAssistantContentSpan = null; // Reference to the span holding streaming text
let abortController = null; // To allow aborting requests if needed (optional, not fully implemented here)
let modelSettings = { ...DEFAULT_SETTINGS }; // Clone default settings

// Load conversations from localStorage if available
function loadConversations() {
    const savedConversations = localStorage.getItem('ollama_conversations');
    if (savedConversations) {
        conversations = JSON.parse(savedConversations);
        // Load the last active conversation or default to a new one
        activeConversationId = localStorage.getItem('ollama_active_conversation') || 'default';
        if (conversations[activeConversationId]) {
            conversationHistory = conversations[activeConversationId].messages || [];
            // Render the loaded conversation
            renderSavedConversation();
        } else {
            // Create a new conversation if the active one doesn't exist
            conversations[activeConversationId] = {
                name: 'New Conversation',
                model: '',
                messages: []
            };
            conversationHistory = [];
        }
    } else {
        // Initialize with a default conversation
        conversations = {
            'default': {
                name: 'New Conversation',
                model: '',
                messages: []
            }
        };
        conversationHistory = [];
    }
}

// Save conversations to localStorage
function saveConversations() {
    // Update the current conversation in the conversations object
    if (!conversations[activeConversationId]) {
        conversations[activeConversationId] = {
            name: 'New Conversation',
            model: modelSelect.value || '',
            messages: [],
            timestamp: Date.now()
        };
    }
    conversations[activeConversationId].messages = conversationHistory;
    conversations[activeConversationId].model = modelSelect.value || conversations[activeConversationId].model;
    conversations[activeConversationId].timestamp = Date.now(); // Update timestamp on save

    // Save to localStorage
    localStorage.setItem('ollama_conversations', JSON.stringify(conversations));
    localStorage.setItem('ollama_active_conversation', activeConversationId);
}

// Render a saved conversation in the UI
function renderSavedConversation() {
    // Clear the current chatbox
    chatbox.innerHTML = '';

    // Render each message in the conversation history
    conversationHistory.forEach(message => {
        if (message.role === 'user') {
            const userContainer = addMessageContainer('user');
            renderMessageContent(userContainer, message.content, 'user');
        } else if (message.role === 'assistant') {
            const modelName = conversations[activeConversationId].model || 'Assistant';
            const assistantContainer = addMessageContainer('assistant', modelName);
            renderMessageContent(assistantContainer, message.content, 'assistant');
        }
    });
}

// --- Conversation Management UI ---
function createNewConversation() {
    // Generate a unique ID for the new conversation
    const newId = 'conv_' + Date.now();

    // Save current conversation before switching
    saveConversations();

    // Create new conversation
    activeConversationId = newId;
    conversations[newId] = {
        name: 'New Conversation',
        model: modelSelect.value || '',
        messages: [],
        timestamp: Date.now()
    };

    // Clear the UI and conversation history
    conversationHistory = [];
    chatbox.innerHTML = '';

    // Save the new conversation structure
    saveConversations();

    // Update the UI to show we're in a new conversation
    updateConversationUI();
    updateConversationsList();

    // Close the sidebar and overlay if they're open
    document.getElementById('conversationsSidebar').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');

    // Focus on the input field
    setTimeout(() => {
        const userInput = document.getElementById('userInput');
        if (userInput) userInput.focus();
    }, 100);

    // Show toast notification
    showToast('New conversation started');
}

function updateConversationUI() {
    // Update the window title with the conversation name
    const conversationName = conversations[activeConversationId]?.name || 'New Conversation';
    document.title = `${conversationName} - Ollama Chat UI`;
}

function updateConversationsList() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;

    conversationsList.innerHTML = '';

    // Sort conversations by timestamp (newest first)
    const sortedConversations = Object.entries(conversations)
        .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0));

    if (sortedConversations.length === 0) {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-4';
        emptyState.innerHTML = `
            <div class="mb-3">
                <i class="bi bi-chat-square-text text-muted" style="font-size: 2rem;"></i>
            </div>
            <p class="text-muted">No conversations yet</p>
            <p class="small text-muted">Start a new chat to begin</p>
        `;
        conversationsList.appendChild(emptyState);
        return;
    }

    // Create a list group container
    const listGroup = document.createElement('div');
    listGroup.classList.add('list-group', 'list-group-flush');
    conversationsList.appendChild(listGroup);

    sortedConversations.forEach(([id, conversation]) => {
        const item = document.createElement('div');
        item.classList.add('conversation-item', 'p-2', 'mb-2');
        if (id === activeConversationId) {
            item.classList.add('active');
        }

        // Create the conversation name element with model badge
        const nameContainer = document.createElement('div');
        nameContainer.classList.add('d-flex', 'flex-column');

        // Add timestamp
        const timestamp = conversation.timestamp ? new Date(conversation.timestamp) : new Date();
        const formattedDate = timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        const header = document.createElement('div');
        header.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-1');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = conversation.name || 'Unnamed Conversation';
        nameSpan.classList.add('conversation-name', 'fw-medium');

        const dateSpan = document.createElement('small');
        dateSpan.textContent = formattedDate;
        dateSpan.classList.add('text-muted');

        header.appendChild(nameSpan);
        header.appendChild(dateSpan);
        nameContainer.appendChild(header);

        // Add preview of last message if available
        if (conversation.messages && conversation.messages.length > 0) {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const preview = document.createElement('small');
            preview.classList.add('text-truncate', 'd-block', 'text-muted');

            // Truncate message to 50 characters
            let previewText = lastMessage.content;
            if (previewText.length > 50) {
                previewText = previewText.substring(0, 50) + '...';
            }

            preview.textContent = `${lastMessage.role === 'user' ? 'You: ' : ''}${previewText}`;
            nameContainer.appendChild(preview);
        }

        // Add model badge if available
        if (conversation.model) {
            const modelBadge = document.createElement('div');
            modelBadge.classList.add('badge', 'bg-secondary', 'mt-2', 'align-self-start');
            modelBadge.innerHTML = `<i class="bi bi-cpu me-1"></i>${conversation.model}`;
            nameContainer.appendChild(modelBadge);
        }

        // Create the actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('conversation-actions');

        // Create rename button
        const renameBtn = document.createElement('button');
        renameBtn.classList.add('btn', 'btn-sm', 'btn-icon');
        renameBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        renameBtn.title = 'Rename conversation';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            renameConversation(id);
        };

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-icon', 'text-danger');
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = 'Delete conversation';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteConversation(id);
        };

        // Add buttons to actions container
        actionsDiv.appendChild(renameBtn);
        actionsDiv.appendChild(deleteBtn);

        const itemContent = document.createElement('div');
        itemContent.classList.add('d-flex', 'justify-content-between', 'align-items-start', 'w-100');
        itemContent.appendChild(nameContainer);
        itemContent.appendChild(actionsDiv);

        item.appendChild(itemContent);

        // Add click handler to load the conversation
        item.addEventListener('click', (e) => {
            if (e.target.closest('.conversation-actions')) return;
            loadConversation(id);
        });

        // Add the item to the list group
        listGroup.appendChild(item);
    });

    // Add a message if no conversations exist
    if (sortedConversations.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No saved conversations';
        emptyMessage.classList.add('text-center', 'text-muted', 'p-4');
        conversationsList.appendChild(emptyMessage);
    }

    // Add a "New Conversation" button at the top
    const newConvBtn = document.createElement('button');
    newConvBtn.classList.add('btn', 'btn-primary', 'w-100', 'mb-3');
    newConvBtn.innerHTML = '<i class="bi bi-plus-lg"></i> New Conversation';
    newConvBtn.addEventListener('click', () => {
        createNewConversation();
    });

    // Insert at the beginning
    conversationsList.insertBefore(newConvBtn, conversationsList.firstChild);
}

function loadConversation(id) {
    if (!conversations[id]) return;

    // Save current conversation before switching
    saveConversations();

    // Switch to the selected conversation
    activeConversationId = id;
    conversationHistory = conversations[id].messages || [];

    // Update the UI
    renderSavedConversation();
    updateConversationUI();
    updateConversationsList();

    // If the model for this conversation is available, select it
    const conversationModel = conversations[id].model;
    if (conversationModel) {
        const modelOption = Array.from(modelSelect.options).find(option => option.value === conversationModel);
        if (modelOption) {
            modelSelect.value = conversationModel;
        }
    }

    // Close the sidebar and overlay
    document.getElementById('conversationsSidebar').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');

    // Show toast notification
    showToast(`Loaded conversation: ${conversations[id].name || 'Unnamed Conversation'}`);
}

function renameConversation(id) {
    if (!conversations[id]) return;

    const currentName = conversations[id].name || 'New Conversation';
    const newName = prompt('Enter a new name for this conversation:', currentName);

    if (newName && newName.trim() !== '') {
        conversations[id].name = newName.trim();
        saveConversations();
        updateConversationUI();
        updateConversationsList();
    }
}

function deleteConversation(id) {
    if (!conversations[id]) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${conversations[id].name || 'this conversation'}"?`);

    if (confirmDelete) {
        // If we're deleting the active conversation, switch to a new one
        if (id === activeConversationId) {
            // Find another conversation to switch to
            const conversationIds = Object.keys(conversations).filter(convId => convId !== id);

            if (conversationIds.length > 0) {
                // Switch to the first available conversation
                loadConversation(conversationIds[0]);
            } else {
                // No other conversations, create a new one
                createNewConversation();
            }
        }

        // Delete the conversation
        delete conversations[id];
        saveConversations();
        updateConversationsList();
    }
}

// --- Export/Import Functionality ---
function exportAllConversations() {
    // Create a JSON file with all conversations
    const conversationsData = JSON.stringify(conversations, null, 2);
    const blob = new Blob([conversationsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `ollama-conversations-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

function importConversations(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedConversations = JSON.parse(e.target.result);

            // Validate the imported data structure
            if (typeof importedConversations !== 'object') {
                throw new Error('Invalid format: Expected an object');
            }

            // Merge with existing conversations (new ones will overwrite existing ones with same ID)
            const mergedConversations = { ...conversations, ...importedConversations };
            conversations = mergedConversations;

            // Save to localStorage
            localStorage.setItem('ollama_conversations', JSON.stringify(conversations));

            // Update the UI
            updateConversationsList();

            // Show success message
            alert(`Successfully imported ${Object.keys(importedConversations).length} conversations.`);

        } catch (error) {
            console.error('Error importing conversations:', error);
            alert(`Error importing conversations: ${error.message}`);
        }

        // Reset the file input
        event.target.value = '';
    };

    reader.readAsText(file);
}
