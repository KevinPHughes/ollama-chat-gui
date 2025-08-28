/**
 * Application Configuration
 * Centralized configuration for the chat application
 */

export const CONFIG = {
  // Application metadata
  APP: {
    name: 'Kevin\'s Chat Assistant',
    version: '2.0.0',
    description: 'A modular chat interface for AI models'
  },

  // API Configuration
  API: {
    baseUrl: '',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  },

  // UI Configuration
  UI: {
    animationDuration: 300,
    debounceDelay: 10,
    scrollThreshold: 5,
    autoResizeDelay: 100
  },

  // Storage Configuration
  STORAGE: {
    maxConversations: 10,
    maxSystemPrompts: 20,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    compressionEnabled: false
  },

  // Theme Configuration
  THEME: {
    default: 'auto', // 'light', 'dark', or 'auto'
    followSystem: true,
    transitions: true
  },

  // Message Configuration
  MESSAGE: {
    maxLength: 10000,
    streamingEnabled: true,
    typingIndicator: true,
    timestampFormat: 'short' // 'short', 'long', or 'relative'
  },

  // Model Configuration
  MODELS: {
    default: 'gpt-oss:20b',
    supportedModels: [
      { id: 'gpt-oss:20b', name: 'OpenAI gpt-oss', supportsThinking: true },
      { id: 'gemma3:12b', name: 'Google Gemini 12', supportsThinking: false },
      { id: 'gemma3:27b', name: 'Google Gemini 27', supportsThinking: false },
      { id: 'gemma3', name: 'Google Gemini', supportsThinking: false },
      { id: 'deepseek-r1', name: 'Deepseek R1', supportsThinking: true },
      { id: 'llama3.2', name: 'Meta Llama', supportsThinking: false },
      // Example: Adding a new model is as simple as adding it here
      // { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', supportsThinking: true }
    ]
  },

  // Feature Flags
  FEATURES: {
    conversationHistory: true,
    systemPrompts: true,
    themeToggle: true,
    exportConversations: false,
    voiceInput: false,
    fileUpload: false,
    multiLanguage: false
  },

  // Development Configuration
  DEV: {
    debug: false,
    mockAPI: false,
    verboseLogging: false,
    showPerformanceMetrics: false
  }
};
