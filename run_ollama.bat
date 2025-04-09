@echo off
echo Starting Ollama with CORS headers enabled...
set OLLAMA_ORIGINS=*
ollama serve
