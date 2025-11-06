/**
 * Application Constants
 * Centralized place for all application constants
 */

import { CONFIG } from '../config/config.js';

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
    conversationList: '#conversationList',
    mobileMenuToggle: '#mobileMenuToggle',
    mobileNewChatBtn: '#mobileNewChatBtn',
    sidebar: '.sidebar',
    sidebarBackdrop: '#sidebarBackdrop',
    scrollToTop: '#scrollToTop',
    sidebarCollapseToggle: '#sidebarCollapseToggle'
  },

  // API Endpoints
  ENDPOINTS: {
    stream: '/stream'
  },

  // Storage Keys
  STORAGE_KEYS: {
    theme: 'theme',
    conversations: 'chatConversations',
    systemPrompts: 'systemPrompts',
    settings: 'appSettings'
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
    emptyHistory: 'empty-history',
    collapsed: 'collapsed'
  },

  // Utility functions
  /**
   * Check if a model supports thinking features
   */
  isThinkingModel: (modelId) => {
    const model = CONFIG.MODELS.supportedModels.find(m => m.id === modelId);
    return model ? model.supportsThinking : false;
  }
};
