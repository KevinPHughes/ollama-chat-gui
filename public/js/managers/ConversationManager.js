/**
 * Conversation Manager
 * Handles conversation modal and related operations
 */

import { CONSTANTS } from '../utils/constants.js';
import { Utils } from '../utils/utils.js';

export class ConversationManager {
  constructor(domManager, messageHandler, storageManager) {
    this.domManager = domManager;
    this.messageHandler = messageHandler;
    this.storageManager = storageManager;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Saved conversations button
    this.domManager.addEventListener('savedConversationsBtn', 'click', () => {
      this.showSavedConversations();
    });

    // Modal close events
    this.domManager.addEventListener('closeModal', 'click', () => {
      this.closeConversationModal();
    });

    this.domManager.addEventListener('conversationModal', 'click', (e) => {
      if (e.target === this.domManager.getElement('conversationModal')) {
        this.closeConversationModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.closeConversationModal();
      }
    });
  }

  /**
   * Show saved conversations in modal
   */
  showSavedConversations() {
    const conversations = this.storageManager.getConversations();
    this.populateConversationModal(conversations);
    this.domManager.setStyle('conversationModal', 'display', 'block');
  }

  /**
   * Close conversation modal
   */
  closeConversationModal() {
    this.domManager.setStyle('conversationModal', 'display', 'none');
  }

  /**
   * Check if modal is open
   */
  isModalOpen() {
    const modal = this.domManager.getElement('conversationModal');
    return modal && modal.style.display === 'block';
  }

  /**
   * Populate conversation modal with conversations
   */
  populateConversationModal(conversations) {
    this.domManager.clear('conversationList');

    if (conversations.length === 0) {
      this.showEmptyState();
      return;
    }

    conversations.forEach(conversation => {
      const conversationItem = this.createConversationItem(conversation);
      this.domManager.appendChild('conversationList', conversationItem);
    });
  }

  /**
   * Show empty state when no conversations exist
   */
  showEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = CONSTANTS.CSS_CLASSES.emptyHistory;
    emptyDiv.textContent = 'No saved conversations found.';
    this.domManager.appendChild('conversationList', emptyDiv);
  }

  /**
   * Create a conversation item element
   */
  createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = CONSTANTS.CSS_CLASSES.conversationItem;
    item.dataset.conversationId = conversation.id;

    // Create title
    const title = this.createConversationTitle(conversation.title);
    item.appendChild(title);

    // Create preview
    const preview = this.createConversationPreview(conversation.messages);
    item.appendChild(preview);

    // Create metadata
    const meta = this.createConversationMeta(conversation);
    item.appendChild(meta);

    // Add click event to load conversation
    item.addEventListener('click', () => {
      this.loadConversation(conversation);
    });

    return item;
  }

  /**
   * Create conversation title element
   */
  createConversationTitle(title) {
    const titleElement = document.createElement('div');
    titleElement.className = CONSTANTS.CSS_CLASSES.conversationTitle;
    titleElement.textContent = title;
    return titleElement;
  }

  /**
   * Create conversation preview element
   */
  createConversationPreview(messages) {
    const preview = document.createElement('div');
    preview.className = CONSTANTS.CSS_CLASSES.conversationPreview;
    
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const previewText = Utils.truncateText(firstUserMessage.content, 100);
      preview.textContent = previewText;
    }

    return preview;
  }

  /**
   * Create conversation metadata element
   */
  createConversationMeta(conversation) {
    const meta = document.createElement('div');
    meta.className = CONSTANTS.CSS_CLASSES.conversationMeta;

    // Date
    const date = document.createElement('span');
    date.className = CONSTANTS.CSS_CLASSES.conversationDate;
    date.textContent = Utils.formatDate(conversation.timestamp);

    // Message count
    const messageCount = document.createElement('span');
    messageCount.className = CONSTANTS.CSS_CLASSES.conversationMessageCount;
    messageCount.textContent = `${conversation.messages.length} messages`;

    meta.appendChild(date);
    meta.appendChild(messageCount);

    return meta;
  }

  /**
   * Load a selected conversation
   */
  loadConversation(conversation) {
    this.messageHandler.loadConversation(conversation);
    this.closeConversationModal();
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId) {
    const conversations = this.storageManager.getConversations();
    const filteredConversations = conversations.filter(conv => conv.id !== conversationId);
    this.storageManager.saveConversations(filteredConversations);
    
    // Refresh modal if open
    if (this.isModalOpen()) {
      this.showSavedConversations();
    }
  }

  /**
   * Get conversation statistics
   */
  getConversationStats() {
    const conversations = this.storageManager.getConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    
    return {
      totalConversations: conversations.length,
      totalMessages: totalMessages,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0
    };
  }
}
