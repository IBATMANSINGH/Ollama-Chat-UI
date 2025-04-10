// DOM Elements
const modelSelect = document.getElementById('modelSelect');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const statusDiv = document.getElementById('status');
const conversationsSidebar = document.getElementById('conversationsSidebar');

// --- Initialize CodeMirror ---
function initCodeMirror() {
    // Check if CodeMirror is available
    if (window.CodeMirror) {
        console.log('CodeMirror initialized successfully');
    } else {
        console.warn('CodeMirror not available');
    }
}

// --- Initial Setup ---
window.onload = () => {
    // Initialize theme
    initTheme();

    // Initialize settings
    initSettings();

    // Initialize CodeMirror
    initCodeMirror();

    // Setup event listeners
    setupEventListeners();

    // Load saved conversations
    loadConversations();

    // Test connection to Ollama and fetch models
    testOllamaConnection();

    // Update the UI for the current conversation
    updateConversationUI();
    updateConversationsList();

    userInput.focus();
};
