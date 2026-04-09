# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Start server with nodemon auto-reload on port 3001
```

There is no test framework configured. Manual test scripts exist at the root:
- `node test-model-selector.js` — verifies model selector population
- `node test-thinking-models.js` — tests thinking model detection
- `node test-thinking-stream.js` — tests thinking stream integration with Ollama

Requires Ollama running locally before starting the server.

## Architecture

**Backend** (`server.js`): Express server on port 3001. Serves `public/streaming.html` as the root. The main endpoint is `POST /stream`, which proxies requests to Ollama and returns Server-Sent Events (SSE) for streaming. It also handles conversation management: estimates token counts, auto-summarizes old messages when history exceeds ~8000 tokens, and preserves system prompts. Supports thinking content streams (e.g., Deepseek R1).

**Frontend** (`public/`): Vanilla JS ES6 modules — no bundler. Entry point is `streaming.html`, which loads `js/ChatApplication.js`. The app uses a manager pattern:

- `ChatApplication.js` — top-level coordinator; wires all managers together
- `managers/` — each manager owns a single concern (DOM refs, localStorage, themes, scroll, message streaming, conversations, general UI)
- `components/MessageFactory.js` — creates message DOM elements
- `components/ThinkingProcessor.js` — parses and renders AI "thinking" blocks
- `config/config.js` — centralized app configuration (models, defaults, limits)
- `utils/` — shared constants and helper functions

The app is accessible at `window.chatApp` in the browser console for debugging.

Markdown rendering uses Marked.js loaded via CDN in `streaming.html`.
