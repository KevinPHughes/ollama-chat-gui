/**
 * Chat Application
 * Main application class that coordinates all managers and components
 */

import { DOMManager } from './managers/DOMManager.js';
import { StorageManager } from './managers/StorageManager.js';
import { ThemeManager } from './managers/ThemeManager.js';
import { ScrollManager } from './managers/ScrollManager.js';
import { MessageHandler } from './managers/MessageHandler.js';
import { ConversationManager } from './managers/ConversationManager.js';
import { UIManager } from './managers/UIManager.js';

export class ChatApplication {
  constructor() {
    this.isInitialized = false;
    this.managers = {};
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('Application already initialized');
      return;
    }

    try {
      // Initialize managers in dependency order
      this.initializeManagers();
      
      // Load initial data
      await this.loadInitialData();
      
      this.isInitialized = true;
      console.log('Chat application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Initialize all managers
   */
  initializeManagers() {
    // DOM Manager - Foundation for all UI operations
    this.managers.dom = new DOMManager();

    // Theme Manager - Handles theme switching
    this.managers.theme = new ThemeManager(this.managers.dom);

    // Scroll Manager - Handles scroll behavior
    this.managers.scroll = new ScrollManager(this.managers.dom);

    // Message Handler - Handles message operations
    this.managers.message = new MessageHandler(
      this.managers.dom,
      this.managers.scroll,
      StorageManager
    );

    // Conversation Manager - Handles conversation modal and operations
    this.managers.conversation = new ConversationManager(
      this.managers.dom,
      this.managers.message,
      StorageManager
    );

    // UI Manager - Handles general UI interactions
    this.managers.ui = new UIManager(
      this.managers.dom,
      this.managers.scroll,
      this.managers.message,
      StorageManager
    );
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    // Load last conversation
    this.managers.message.loadLastConversation();
  }

  /**
   * Get a manager instance
   */
  getManager(name) {
    if (!this.managers[name]) {
      throw new Error(`Manager '${name}' not found`);
    }
    return this.managers[name];
  }

  /**
   * Get application state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      theme: this.managers.theme?.getCurrentTheme(),
      ui: this.managers.ui?.getUIState(),
      scroll: this.managers.scroll?.getScrollState(),
      conversation: this.managers.message?.getConversationHistory(),
      storage: StorageManager.getStorageInfo()
    };
  }

  /**
   * Reset application to initial state
   */
  reset() {
    // Clear current conversation
    this.managers.message?.startNewConversation();
    
    // Clear UI
    this.managers.ui?.clearChatInput();
    this.managers.ui?.hideSystemPromptPanel();
    
    // Scroll to bottom
    this.managers.scroll?.scrollToBottom();
  }

  /**
   * Handle application errors
   */
  handleError(error, context = 'Unknown') {
    console.error(`Application error in ${context}:`, error);
    
    // Could implement error reporting or user notification here
    this.managers.ui?.showNotification(
      'An error occurred. Please try again.',
      'error'
    );
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Save current state before cleanup
    if (this.managers.message?.getConversationHistory().length > 0) {
      StorageManager.saveConversation(this.managers.message.getConversationHistory());
    }

    // Cleanup managers if they have cleanup methods
    Object.values(this.managers).forEach(manager => {
      if (manager.destroy && typeof manager.destroy === 'function') {
        manager.destroy();
      }
    });

    this.isInitialized = false;
    this.managers = {};
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new ChatApplication();
  
  try {
    await app.initialize();
    
    // Make app globally available for debugging
    window.chatApp = app;
  } catch (error) {
    console.error('Failed to start application:', error);
  }
});
