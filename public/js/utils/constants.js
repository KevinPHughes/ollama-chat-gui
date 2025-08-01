/**
 * Application Constants
 * Centralized place for all application constants
 */

export const CONSTANTS = {
  SCROLL_THRESHOLD: 5,
  MAX_SAVED_CONVERSATIONS: 10,
  MAX_SAVED_PROMPTS: 20,
  
  // DOM Selectors
  SELECTORS: {
    chatInput: '#chatInput',
    chatMessages: '#chatMessages',
    sendButton: '#sendButton',
    modelSelector: '#modelSelector',
    themeToggle: '#themeToggle',
    chatHeader: '.chat-header',
    chatContainer: '.chat-container',
    systemPromptToggle: '#systemPromptToggle',
    systemPromptPanel: '#systemPromptPanel',
    systemPromptInput: '#systemPromptInput',
    savedPromptsSelector: '#savedPromptsSelector',
    newConversationBtn: '#newConversationBtn',
    savedConversationsBtn: '#savedConversationsBtn',
    conversationModal: '#conversationModal',
    closeModal: '#closeModal',
    conversationList: '#conversationList'
  },

  // API Endpoints
  ENDPOINTS: {
    stream: '/stream'
  },

  // Storage Keys
  STORAGE_KEYS: {
    theme: 'theme',
    conversations: 'chatConversations',
    systemPrompts: 'systemPrompts'
  },

  // Model Types
  MODELS: {
    DEEPSEEK_R1: 'deepseek-r1'
  },

  // CSS Classes
  CSS_CLASSES: {
    darkTheme: 'dark-theme',
    hidden: 'hidden',
    headerHidden: 'header-hidden',
    headerVisible: 'header-visible',
    withSystemPrompt: 'with-system-prompt',
    visible: 'visible',
    loading: 'loading',
    userMessage: 'user-message',
    botMessage: 'bot-message',
    message: 'message',
    messageContent: 'message-content',
    messageActions: 'message-actions',
    messageTime: 'message-time',
    copyButton: 'copy-button',
    responseWrapper: 'response-wrapper',
    regularContent: 'regular-content',
    thinkingSection: 'thinking-section',
    thinkingComplete: 'thinking-complete',
    tableResponsive: 'table-responsive',
    conversationItem: 'conversation-item',
    conversationTitle: 'conversation-title',
    conversationPreview: 'conversation-preview',
    conversationMeta: 'conversation-meta',
    conversationDate: 'conversation-date',
    conversationMessageCount: 'conversation-message-count',
    emptyHistory: 'empty-history'
  }
};
