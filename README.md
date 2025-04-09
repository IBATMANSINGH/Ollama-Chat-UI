# Simple Ollama Web UI

A lightweight, single-file HTML web interface for interacting with your locally running Ollama instance. Chat with different models, view responses in real-time, and easily copy generated code snippets.

<!-- Optional: Add a screenshot of the UI in action -->
<!-- ![Screenshot](link/to/your/screenshot.png) -->

## Features

*   **Connects to Local Ollama:** Interacts directly with the Ollama API running on your machine (default: `http://localhost:11434`).
*   **Model Selection:** Automatically fetches and lists your locally available Ollama models in a dropdown.
*   **Streaming Responses:** Displays model responses token-by-token as they are generated.
*   **Conversation History:** Maintains context by sending the previous messages back to the model.
*   **Code Block Detection:** Automatically identifies Markdown code blocks (``` ... ```) in the model's response.
*   **Copy Code Button:** Adds a convenient "Copy" button next to each detected code block.
*   **Simple Deployment:** Runs entirely within a single HTML file – no server-side code or complex setup required (besides Ollama itself).
*   **Basic Responsive UI:** Designed to be usable on different screen sizes.

## Prerequisites

Before you can use this UI, you need:

1.  **Ollama Installed:** Download and install Ollama from [https://ollama.com/](https://ollama.com/).
2.  **Ollama Running:** Ensure the Ollama service is running. You can usually start it by running `ollama serve` in your terminal.
3.  **Ollama Models:** Pull at least one model using the Ollama CLI (e.g., `ollama pull llama3`). The UI will list the models you have pulled.
4.  **Web Browser:** A modern web browser (like Chrome, Firefox, Edge, Safari) that supports Fetch API, async/await, and `navigator.clipboard`.

## How to Use

1.  **Ensure Ollama is Running:** Open your terminal and run `ollama serve`. Keep it running in the background.
2.  **Download:** Download the main HTML file (e.g., `ollama_ui.html`) from the [repository](https://github.com/IBATMANSINGH/Ollama-Chat-UI).
3.  **Open:** Open the downloaded HTML file directly in your web browser (usually by double-clicking it or using `File > Open File...`).
4.  **Select Model:** Choose one of your installed models from the dropdown menu at the top.
5.  **Chat:** Type your message in the input box at the bottom and press Enter or click "Send".

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

## Limitations & Known Issues

*   **Basic UI:** The interface is functional but minimalist.
*   **Simple Code Detection:** Uses regex to find ``` blocks; might not handle nested or unusual Markdown perfectly.
*   **No Persistent History:** Chat history is lost when the page is closed or refreshed.
*   **Basic Error Handling:** Error messages are displayed, but recovery options are limited.
*   **No Advanced Ollama Features:** Doesn't expose options like temperature, system prompts, etc.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/IBATMANSINGH/Ollama-Chat-UI/issues) if you want to contribute.

## License

This project is licensed under the **MIT License**.

---

**Recommendation:**

For the license to be fully effective, you should also add a file named `LICENSE` (or `LICENSE.md`) to the root of your repository containing the full text of the MIT License. You can easily find the standard MIT License text online, for example, at the [Open Source Initiative](https://opensource.org/licenses/MIT). Just copy and paste that text into your `LICENSE` file.
