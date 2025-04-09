// DOM Elements
const modelSelect = document.getElementById('modelSelect');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const statusDiv = document.getElementById('status');
const conversationsSidebar = document.getElementById('conversationsSidebar');

// --- Initial Setup ---
window.onload = () => {
    // Initialize theme
    initTheme();
    
    // Initialize settings
    initSettings();
    
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
