# Kevin's Chat Assistant

A modern, modular chat interface for Ollama LLM models with streaming responses and clean architecture.

## Features

### Core Features
- **Real-time streaming** of AI responses
- **Markdown rendering** with proper code highlighting
- **Conversation history** with persistent storage
- **System prompts** with saved templates
- **Multiple model support** (Gemma, Deepseek, Llama)
- **Theme switching** (light/dark mode with system detection)
- **Responsive design** for desktop and mobile

### Advanced Features
- **Thinking content processing** for compatible models (Deepseek R1)
- **Smart scroll management** with auto-hide header
- **Message actions** (copy, timestamp)
- **Table enhancement** with responsive wrappers
- **Auto-resizing input** with keyboard shortcuts

## Architecture

This application has been completely refactored from a monolithic structure to a clean, modular architecture following SOLID principles. See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

### Key Benefits
- **Maintainable**: Single responsibility per module
- **Testable**: Clear interfaces and dependency injection
- **Scalable**: Easy to add new features
- **Configurable**: Centralized configuration system

## Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd ollamaGUI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure Ollama is installed and running on your system

4. Start the server:
   ```bash
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3001/`
2. Select your preferred AI model from the dropdown
3. Optionally set a system prompt using the prompt panel
4. Type a message and press Enter to chat with the AI
5. Use Shift+Enter for multi-line messages

### Advanced Usage

- **System Prompts**: Click the info icon to open the system prompt panel
- **Conversation History**: Click the history icon to view and load saved conversations
- **Theme Toggle**: Click the theme icon to switch between light and dark modes
- **New Conversation**: Click the plus icon to start fresh

## Configuration

The application is highly configurable through `js/config/config.js`. You can modify:

- API settings and timeouts
- UI behavior and animations
- Storage limits and cleanup
- Theme preferences
- Feature flags
- Model configurations

## Technology Stack

### Frontend
- **Vanilla JavaScript** (ES6+ modules)
- **HTML5** with semantic elements
- **CSS3** with modern features
- **Marked.js** for markdown parsing

### Backend
- **Node.js** runtime
- **Express.js** web framework
- **Ollama** integration for AI models

### Architecture
- **Modular design** with clear separation of concerns
- **Manager pattern** for coordinating components
- **Factory pattern** for creating UI elements
- **Observer pattern** for event handling

## Development

The modular architecture makes development straightforward:

```javascript
// Access the application instance
const app = window.chatApp;

// Get specific managers
const messageHandler = app.getManager('message');
const themeManager = app.getManager('theme');

// Check application state
console.log(app.getState());
```

### Adding New Features

1. Create new modules in the appropriate directory
2. Follow the established patterns and interfaces
3. Add configuration options to `config.js`
4. Update constants and utilities as needed
5. Test thoroughly and update documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style and architecture
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details.