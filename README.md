# Enhanced Ollama Web UI

A feature-rich, single-file HTML web interface for interacting with your locally running Ollama instance. Chat with different models, view responses in real-time, save conversations, and customize model parameters.

<!-- Optional: Add a screenshot of the UI in action -->
<!-- ![Screenshot](link/to/your/screenshot.png) -->

## Features

*   **Connects to Local Ollama:** Interacts directly with the Ollama API running on your machine (default: `http://localhost:11434`).
*   **Model Selection:** Automatically fetches and lists your locally available Ollama models in a dropdown.
*   **Streaming Responses:** Displays model responses token-by-token as they are generated.
*   **Persistent Conversation History:** Saves conversations to localStorage so they persist between sessions.
*   **Dark/Light Mode:** Toggle between dark and light themes with a single click.
*   **Model Parameters Control:** Adjust temperature, top_p, and max tokens to customize model responses.
*   **System Prompt Support:** Set custom system prompts to guide the model's behavior.
*   **Conversation Management:** Create, rename, delete, and switch between multiple conversations.
*   **Export/Import Conversations:** Save conversations to files and load them back later.
*   **Code Block Detection:** Automatically identifies Markdown code blocks (``` ... ```) in the model's response.
*   **Copy Code Button:** Adds a convenient "Copy" button next to each detected code block.
*   **Simple Deployment:** Runs entirely within a single HTML file – no server-side code or complex setup required (besides Ollama itself).
*   **Responsive UI:** Designed to be usable on different screen sizes.

## Prerequisites

Before you can use this UI, you need:

1.  **Ollama Installed:** Download and install Ollama from [https://ollama.com/](https://ollama.com/).
2.  **Ollama Running:** Ensure the Ollama service is running. You can usually start it by running `ollama serve` in your terminal.
3.  **Ollama Models:** Pull at least one model using the Ollama CLI (e.g., `ollama pull llama3`). The UI will list the models you have pulled.
4.  **Web Browser:** A modern web browser (like Chrome, Firefox, Edge, Safari) that supports Fetch API, async/await, and `navigator.clipboard`.

## How to Use

1.  **Ensure Ollama is Running with CORS Headers:**
    - To avoid browser security restrictions, run Ollama with CORS headers enabled
    - Use the included `run_ollama_with_cors.bat` file, or
    - Run this command in your terminal: `set OLLAMA_ORIGINS=* && ollama serve` (Windows) or `OLLAMA_ORIGINS="*" ollama serve` (Mac/Linux)

2.  **Download:** Download the files from the [repository](https://github.com/IBATMANSINGH/Ollama-Chat-UI).

3.  **Open:** Open the `index.html` file directly in your web browser (usually by double-clicking it or using `File > Open File...`).

4.  **Select Model:** Choose one of your installed models from the dropdown menu at the top.

5.  **Customize Settings:** Click the ⚙️ button to adjust model parameters like temperature and system prompt.

6.  **Manage Conversations:** Use the "Conversations" button to create, rename, delete, or switch between conversations.

7.  **Chat:** Type your message in the input box at the bottom and press Enter or click "Send".

8.  **Export/Import:** Use the buttons at the bottom of the conversations sidebar to save or restore your chat history.

## Configuration

*   **Ollama API URL:** If your Ollama instance is running on a different address or port, you need to edit the `OLLAMA_API_BASE_URL` constant within the `<script>` section of the HTML file:
    ```javascript
    const OLLAMA_API_BASE_URL = 'http://your-ollama-address:port'; // Default: 'http://localhost:11434'
    ```
*   **CORS:** When opening the HTML file directly from your local filesystem (`file://...`), browsers typically allow requests to `localhost`, so CORS shouldn't be an issue. If you host this file on a different domain or encounter CORS errors, you might need to configure Ollama's allowed origins using the `OLLAMA_ORIGINS` environment variable when running `ollama serve`. See the [Ollama documentation](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-expose-ollama-on-my-network) for details.

## Technology Stack

*   **HTML:** Structure and content.
*   **CSS:** Styling (embedded within the HTML file).
*   **JavaScript:** Application logic, API interaction (Fetch API), DOM manipulation, clipboard access.
*   **Ollama API:** Backend interaction for model listing and chat generation.

## Troubleshooting

### CORS Errors

If you see errors like "Access to fetch at 'http://localhost:11434/api/version' has been blocked by CORS policy", you need to run Ollama with CORS headers enabled:

1. Close any running Ollama instances
2. Run the included `run_ollama_with_cors.bat` file, or
3. Run this command in your terminal:
   - Windows: `set OLLAMA_ORIGINS=* && ollama serve`
   - Mac/Linux: `OLLAMA_ORIGINS="*" ollama serve`

### No Models Showing

If no models appear in the dropdown:

1. Make sure Ollama is running with `ollama serve`
2. Check if you have any models installed with `ollama list`
3. If no models are installed, pull one with `ollama pull llama3` or another model of your choice

## Limitations & Known Issues

*   **Simple Code Detection:** Uses regex to find ``` blocks; might not handle nested or unusual Markdown perfectly.
*   **Basic Error Handling:** Error messages are displayed, but recovery options are limited.
*   **Limited Markdown Support:** Only code blocks are specially formatted; other markdown elements are displayed as plain text.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/IBATMANSINGH/Ollama-Chat-UI/issues) if you want to contribute.

## 🤖 AI-Assisted Development Process

This project was built using a "prompt-first" approach, where I leveraged an LLM as a coding co-pilot to translate a concept into a functional application.

*   **The Core Prompt:** I began by architecting the project with a high-level prompt to create the application's structure:
    > *"Build a chat application using Streamlit that interacts with a locally running Ollama model. The UI should have a chat input box at the bottom and a conversation history display area. The app needs to maintain the session state to remember the conversation history."*

*   **Iteration and Refinement:** The AI generated the basic Streamlit UI. I then used follow-up prompts to connect it to the backend and improve the user experience:
    *   "Write the Python code to make an API call to the local Ollama server's `/api/generate` endpoint."
    *   "Implement logic to store and display the chat history using Streamlit's `st.session_state`."
    *   "Create a 'Clear Chat' button that resets the conversation history."

*   **My Role as the Developer:** My primary role was not just to code, but to act as the architect. This involved designing the prompts, critically evaluating and debugging the AI-generated code, managing the application's state, and ensuring a seamless, real-time chat experience for the user.

## License

This project is licensed under the **MIT License**.

## Author
Made With Vibes & ❤️ By Ankit Singh

---


