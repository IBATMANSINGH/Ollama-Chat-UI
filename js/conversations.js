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

    // Close the sidebar if it's open
    conversationsSidebar.classList.remove('show');
}

function updateConversationUI() {
    // Update the window title with the conversation name
    const conversationName = conversations[activeConversationId]?.name || 'New Conversation';
    document.title = `${conversationName} - Ollama Chat UI`;
}

function updateConversationsList() {
    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = '';

    // Create a list group container
    const listGroup = document.createElement('div');
    listGroup.classList.add('list-group', 'list-group-flush');
    conversationsList.appendChild(listGroup);

    // Sort conversations by timestamp (newest first)
    const sortedConversations = Object.entries(conversations)
        .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0));

    sortedConversations.forEach(([id, conversation]) => {
        const item = document.createElement('a');
        item.href = '#';
        item.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between', 'align-items-center');
        if (id === activeConversationId) {
            item.classList.add('active');
        }

        // Create the conversation name element with model badge
        const nameContainer = document.createElement('div');
        nameContainer.classList.add('d-flex', 'flex-column');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = conversation.name || 'Unnamed Conversation';
        nameSpan.classList.add('conversation-name', 'text-truncate');

        // Add model badge if available
        if (conversation.model) {
            const modelBadge = document.createElement('small');
            modelBadge.classList.add('badge', 'bg-secondary', 'mt-1');
            modelBadge.textContent = conversation.model;
            nameContainer.appendChild(nameSpan);
            nameContainer.appendChild(modelBadge);
        } else {
            nameContainer.appendChild(nameSpan);
        }

        // Create the actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('btn-group', 'btn-group-sm');

        // Create rename button
        const renameBtn = document.createElement('button');
        renameBtn.classList.add('btn', 'btn-outline-secondary');
        renameBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        renameBtn.title = 'Rename conversation';
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            renameConversation(id);
        };

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-outline-danger');
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = 'Delete conversation';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteConversation(id);
        };

        // Add buttons to actions container
        actionsDiv.appendChild(renameBtn);
        actionsDiv.appendChild(deleteBtn);

        // Add elements to the conversation item
        item.appendChild(nameContainer);
        item.appendChild(actionsDiv);

        // Add click handler to load the conversation
        item.addEventListener('click', (e) => {
            e.preventDefault();
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

    // Close the sidebar
    conversationsSidebar.classList.remove('show');
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
