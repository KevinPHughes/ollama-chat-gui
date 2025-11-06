/**
 * UI Manager
 * Handles UI interactions, system prompt panel, and interface updates
 */

import { CONSTANTS } from '../utils/constants.js';
import { CONFIG } from '../config/config.js';
import { StorageManager } from './StorageManager.js';

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
    this.loadSidebarState();
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

    // Mobile menu toggle
    this.domManager.addEventListener('mobileMenuToggle', 'click', () => {
      this.toggleMobileSidebar();
    });

    // Mobile new chat button
    this.domManager.addEventListener('mobileNewChatBtn', 'click', () => {
      this.messageHandler.startNewConversation();
    });

    // Mobile sidebar backdrop click
    this.domManager.addEventListener('sidebarBackdrop', 'click', () => {
      this.closeMobileSidebar();
    });

    // Desktop sidebar collapse toggle
    this.domManager.addEventListener('sidebarCollapseToggle', 'click', () => {
      this.toggleSidebarCollapse();
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

    // ESC key to close mobile sidebar
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeMobileSidebar();
      }
    });

    // Close mobile sidebar when clicking sidebar buttons (like New Chat)
    this.domManager.addEventListener('newConversationBtn', 'click', () => {
      this.closeMobileSidebar();
    }, true); // Use capture to ensure this runs
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
   * Toggle mobile sidebar visibility
   */
  toggleMobileSidebar() {
    const sidebar = this.domManager.getElement('sidebar');
    const backdrop = this.domManager.getElement('sidebarBackdrop');
    
    if (sidebar && backdrop) {
      const isVisible = sidebar.classList.contains('mobile-visible');
      
      if (isVisible) {
        this.closeMobileSidebar();
      } else {
        this.openMobileSidebar();
      }
    } else {
      console.warn('Mobile sidebar elements not found:', { sidebar: !!sidebar, backdrop: !!backdrop });
    }
  }

  /**
   * Open mobile sidebar
   */
  openMobileSidebar() {
    const sidebar = this.domManager.getElement('sidebar');
    const backdrop = this.domManager.getElement('sidebarBackdrop');
    
    if (sidebar && backdrop) {
      sidebar.classList.add('mobile-visible');
      backdrop.classList.add('visible');
      
      // Prevent body scrolling when sidebar is open
      document.body.style.overflow = 'hidden';
      
      // Force sidebar to be expanded on mobile (ignore desktop collapse state)
      // The CSS handles the visual override, this is just for consistency
    }
  }

  /**
   * Close mobile sidebar
   */
  closeMobileSidebar() {
    const sidebar = this.domManager.getElement('sidebar');
    const backdrop = this.domManager.getElement('sidebarBackdrop');
    
    if (sidebar && backdrop) {
      sidebar.classList.remove('mobile-visible');
      backdrop.classList.remove('visible');
      
      // Restore body scrolling
      document.body.style.overflow = '';
    }
  }

  /**
   * Toggle desktop sidebar collapse state
   */
  toggleSidebarCollapse() {
    const sidebar = this.domManager.getElement('sidebar');
    
    if (sidebar) {
      const isCollapsed = sidebar.classList.contains(CONSTANTS.CSS_CLASSES.collapsed);
      
      if (isCollapsed) {
        this.expandSidebar();
      } else {
        this.collapseSidebar();
      }
      
      // Save the collapsed state to localStorage
      StorageManager.setSetting('sidebarCollapsed', !isCollapsed);
    }
  }

  /**
   * Collapse the desktop sidebar
   */
  collapseSidebar() {
    const sidebar = this.domManager.getElement('sidebar');
    const collapseButton = this.domManager.getElement('sidebarCollapseToggle');
    
    if (sidebar) {
      sidebar.classList.add(CONSTANTS.CSS_CLASSES.collapsed);
    }
    
    if (collapseButton) {
      collapseButton.setAttribute('aria-label', 'Expand sidebar');
      collapseButton.setAttribute('title', 'Expand sidebar');
    }
  }

  /**
   * Expand the desktop sidebar
   */
  expandSidebar() {
    const sidebar = this.domManager.getElement('sidebar');
    const collapseButton = this.domManager.getElement('sidebarCollapseToggle');
    
    if (sidebar) {
      sidebar.classList.remove(CONSTANTS.CSS_CLASSES.collapsed);
    }
    
    if (collapseButton) {
      collapseButton.setAttribute('aria-label', 'Collapse sidebar');
      collapseButton.setAttribute('title', 'Collapse sidebar');
    }
  }

  /**
   * Load sidebar collapsed state from storage
   */
  loadSidebarState() {
    const isCollapsed = StorageManager.getSetting('sidebarCollapsed', false);
    
    if (isCollapsed) {
      this.collapseSidebar();
    }
  }

  /**
   * Get UI state
   */
  getUIState() {
    const sidebar = this.domManager.getElement('sidebar');
    
    return {
      systemPromptVisible: this.domManager.hasClass('systemPromptPanel', CONSTANTS.CSS_CLASSES.visible),
      selectedModel: this.getSelectedModel(),
      systemPrompt: this.getSystemPrompt(),
      chatInputValue: this.domManager.getValue('chatInput'),
      mobileSidebarVisible: sidebar ? sidebar.classList.contains('mobile-visible') : false,
      sidebarCollapsed: sidebar ? sidebar.classList.contains(CONSTANTS.CSS_CLASSES.collapsed) : false
    };
  }
}
