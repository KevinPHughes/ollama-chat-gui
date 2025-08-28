/**
 * UI Manager
 * Handles UI interactions, system prompt panel, and interface updates
 */

import { CONSTANTS } from '../utils/constants.js';
import { CONFIG } from '../config/config.js';

export class UIManager {
  constructor(domManager, scrollManager, messageHandler, storageManager) {
    this.domManager = domManager;
    this.scrollManager = scrollManager;
    this.messageHandler = messageHandler;
    this.storageManager = storageManager;
    this.initialize();
  }

  /**
   * Initialize UI
   */
  initialize() {
    this.setupInitialState();
    this.populateModelSelector();
    this.setupEventListeners();
    this.configureMarkdown();
    this.loadLastSystemPrompt();
  }

  /**
   * Set up initial UI state
   */
  setupInitialState() {
    // Set initial body padding
    document.body.style.paddingTop = '0';
    
    // Focus chat input
    this.domManager.focus('chatInput');
  }

  /**
   * Populate model selector from configuration
   */
  populateModelSelector() {
    const modelSelector = this.domManager.getElement('modelSelector');
    
    // Clear existing options
    modelSelector.innerHTML = '';

    // Add models from configuration
    CONFIG.MODELS.supportedModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      
      // Add visual indicator for thinking models
      if (model.supportsThinking) {
        option.textContent += ' 🧠';
      }
      
      modelSelector.appendChild(option);
    });

    // Set default model if specified in config
    if (CONFIG.MODELS.default) {
      this.domManager.setValue('modelSelector', CONFIG.MODELS.default);
    }
  }

  /**
   * Refresh model selector (useful for dynamic model updates)
   */
  refreshModelSelector() {
    const currentSelection = this.getSelectedModel();
    this.populateModelSelector();
    
    // Try to restore previous selection if it still exists
    const modelSelector = this.domManager.getElement('modelSelector');
    const options = Array.from(modelSelector.options);
    const hasCurrentSelection = options.some(option => option.value === currentSelection);
    
    if (hasCurrentSelection) {
      this.setSelectedModel(currentSelection);
    }
  }

  /**
   * Set up UI event listeners
   */
  setupEventListeners() {
    // System prompt toggle
    this.domManager.addEventListener('systemPromptToggle', 'click', () => {
      this.toggleSystemPromptPanel();
    });

    // New conversation button
    this.domManager.addEventListener('newConversationBtn', 'click', () => {
      this.messageHandler.startNewConversation();
    });

    // Input events
    this.domManager.addEventListener('sendButton', 'click', () => {
      this.messageHandler.sendMessage();
    });

    this.domManager.addEventListener('chatInput', 'input', () => {
      this.messageHandler.autoResizeTextarea();
    });

    this.domManager.addEventListener('chatInput', 'keydown', (event) => {
      this.messageHandler.handleKeyDown(event);
    });

    // Saved prompts selector
    this.domManager.addEventListener('savedPromptsSelector', 'change', () => {
      this.loadSelectedPrompt();
    });
  }

  /**
   * Configure markdown parser
   */
  configureMarkdown() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Convert line breaks to <br>
        tables: true,
        smartLists: true,
        xhtml: true,
        highlight: function (code, lang) {
          return code;
        },
      });
    }
  }

  /**
   * Toggle system prompt panel visibility
   */
  toggleSystemPromptPanel() {
    this.domManager.toggleClass('systemPromptPanel', CONSTANTS.CSS_CLASSES.visible);
    this.domManager.toggleClass('chatContainer', CONSTANTS.CSS_CLASSES.withSystemPrompt);

    // Adjust chat container spacing
    this.scrollManager.handleWindowResize();
  }

  /**
   * Load last system prompt and populate dropdown
   */
  loadLastSystemPrompt() {
    const savedPrompts = this.storageManager.getSystemPrompts();
    if (savedPrompts.length > 0) {
      // Load the most recent system prompt
      this.domManager.setValue('systemPromptInput', savedPrompts[0].content);
    }

    // Update saved prompts dropdown
    this.updateSavedPromptsDropdown();
  }

  /**
   * Update the saved prompts dropdown
   */
  updateSavedPromptsDropdown() {
    const savedPrompts = this.storageManager.getSystemPrompts();
    this.domManager.setHTML('savedPromptsSelector', '<option value="">Load saved prompt...</option>');

    savedPrompts.forEach(prompt => {
      const option = document.createElement('option');
      option.value = prompt.id;
      option.textContent = prompt.title;
      this.domManager.getElement('savedPromptsSelector').appendChild(option);
    });
  }

  /**
   * Load a selected prompt from the dropdown
   */
  loadSelectedPrompt() {
    const selectedId = this.domManager.getValue('savedPromptsSelector');
    if (!selectedId) return;

    const selectedPrompt = this.storageManager.getSystemPromptById(selectedId);
    if (selectedPrompt) {
      this.domManager.setValue('systemPromptInput', selectedPrompt.content);
    }
  }

  /**
   * Show system prompt panel
   */
  showSystemPromptPanel() {
    if (!this.domManager.hasClass('systemPromptPanel', CONSTANTS.CSS_CLASSES.visible)) {
      this.toggleSystemPromptPanel();
    }
  }

  /**
   * Hide system prompt panel
   */
  hideSystemPromptPanel() {
    if (this.domManager.hasClass('systemPromptPanel', CONSTANTS.CSS_CLASSES.visible)) {
      this.toggleSystemPromptPanel();
    }
  }

  /**
   * Clear chat input
   */
  clearChatInput() {
    this.domManager.setValue('chatInput', '');
    this.domManager.setStyle('chatInput', 'height', 'auto');
  }

  /**
   * Set chat input value
   */
  setChatInput(value) {
    this.domManager.setValue('chatInput', value);
    this.messageHandler.autoResizeTextarea();
  }

  /**
   * Get selected model
   */
  getSelectedModel() {
    return this.domManager.getValue('modelSelector');
  }

  /**
   * Set selected model
   */
  setSelectedModel(model) {
    this.domManager.setValue('modelSelector', model);
  }

  /**
   * Get system prompt
   */
  getSystemPrompt() {
    return this.domManager.getValue('systemPromptInput');
  }

  /**
   * Set system prompt
   */
  setSystemPrompt(prompt) {
    this.domManager.setValue('systemPromptInput', prompt);
  }

  /**
   * Show loading state
   */
  showLoading() {
    // Could add a global loading indicator here
    this.domManager.getElement('sendButton').disabled = true;
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.domManager.getElement('sendButton').disabled = false;
  }

  /**
   * Display notification/toast message
   */
  showNotification(message, type = 'info') {
    // Could implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  /**
   * Get UI state
   */
  getUIState() {
    return {
      systemPromptVisible: this.domManager.hasClass('systemPromptPanel', CONSTANTS.CSS_CLASSES.visible),
      selectedModel: this.getSelectedModel(),
      systemPrompt: this.getSystemPrompt(),
      chatInputValue: this.domManager.getValue('chatInput')
    };
  }
}
