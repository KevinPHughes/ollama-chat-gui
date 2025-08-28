/**
 * Message Handler
 * Handles message sending, receiving, and processing
 */

import { CONSTANTS } from '../utils/constants.js';
import { MessageFactory } from '../components/MessageFactory.js';
import { ThinkingProcessor } from '../components/ThinkingProcessor.js';

export class MessageHandler {
  constructor(domManager, scrollManager, storageManager) {
    this.domManager = domManager;
    this.scrollManager = scrollManager;
    this.storageManager = storageManager;
    this.conversationHistory = [];
  }

  /**
   * Send a message and process the response
   */
  async sendMessage() {
    const message = this.domManager.getValue('chatInput').trim();
    if (!message) return;

    const selectedModel = this.domManager.getValue('modelSelector');
    const supportsThinking = CONSTANTS.isThinkingModel(selectedModel);
    const systemPrompt = this.domManager.getValue('systemPromptInput').trim();

    // Save system prompt if provided
    if (systemPrompt) {
      this.storageManager.saveSystemPrompt(systemPrompt);
      this.updateSavedPromptsDropdown();
    }

    // Create and display user message
    const userMessageElement = MessageFactory.createMessageElement(message, true);
    this.domManager.appendChild('chatMessages', userMessageElement);
    
    // Clear input
    this.domManager.setValue('chatInput', '');
    this.domManager.setStyle('chatInput', 'height', 'auto');

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: message });

    // Create bot response element
    const botResponseElement = MessageFactory.createMessageElement('', false);
    botResponseElement.classList.add(CONSTANTS.CSS_CLASSES.loading);
    this.domManager.appendChild('chatMessages', botResponseElement);

    // Enable auto-scroll and scroll to bottom
    this.scrollManager.enableAutoScroll();
    this.scrollManager.scrollToBottomIfNeeded();

    try {
      const response = await this.fetchStreamingResponse(message, selectedModel, systemPrompt);
      await this.handleStreamingResponse(response, botResponseElement, supportsThinking);
    } catch (error) {
      this.handleError(error, botResponseElement);
    }
  }

  /**
   * Fetch streaming response from server
   */
  async fetchStreamingResponse(message, model, systemPrompt) {
    return await fetch(CONSTANTS.ENDPOINTS.stream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        messages: this.conversationHistory,
        model: model,
        systemPrompt: systemPrompt
      }),
    });
  }

  /**
   * Handle streaming response from the server
   */
  async handleStreamingResponse(response, botResponseElement, supportsThinking) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    // Remove loading indicator
    botResponseElement.classList.remove(CONSTANTS.CSS_CLASSES.loading);

    // Process the streaming response
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') break;

          try {
            const chunk = JSON.parse(data);
            if (chunk.message?.content) {
              fullResponse += chunk.message.content;
              this.updateBotMessage(botResponseElement, fullResponse, supportsThinking);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }

    // Finalize message
    this.finalizeMessage(botResponseElement, fullResponse);
  }

  /**
   * Update bot message during streaming
   */
  updateBotMessage(botResponseElement, fullResponse, supportsThinking) {
    // Process thinking content for thinking-capable models
    const processedContent = ThinkingProcessor.processThinkingContent(
      fullResponse,
      botResponseElement,
      supportsThinking
    );

    // Find regular content container
    const regularContentContainer = ThinkingProcessor.getRegularContentContainer(botResponseElement);

    // Update regular content
    if (regularContentContainer) {
      regularContentContainer.innerHTML = MessageFactory.processHTML(marked.parse(processedContent));
    }

    // Scroll to bottom as new content arrives
    this.scrollManager.scrollToBottomIfNeeded();
  }

  /**
   * Finalize message after streaming is complete
   */
  finalizeMessage(botResponseElement, fullResponse) {
    // Add to conversation history
    this.conversationHistory.push({ role: 'assistant', content: fullResponse });

    // Update copy button
    MessageFactory.updateCopyButton(botResponseElement, fullResponse);

    // Update timestamp
    MessageFactory.updateMessageTimestamp(botResponseElement);

    // Save conversation
    this.storageManager.saveConversation(this.conversationHistory);
  }

  /**
   * Handle errors during message sending
   */
  handleError(error, botResponseElement) {
    console.error('Error:', error);
    botResponseElement.textContent = 'Error: Could not get a response';
    
    // Add timestamp to error message
    MessageFactory.updateMessageTimestamp(botResponseElement);
  }

  /**
   * Start new conversation
   */
  startNewConversation() {
    // Save current conversation before clearing
    if (this.conversationHistory.length > 0) {
      this.storageManager.saveConversation(this.conversationHistory);
    }

    // Clear conversation
    this.conversationHistory = [];
    this.domManager.clear('chatMessages');
  }

  /**
   * Load conversation
   */
  loadConversation(conversation) {
    // Save current conversation before loading new one
    if (this.conversationHistory.length > 0) {
      this.storageManager.saveConversation(this.conversationHistory);
    }

    // Load the selected conversation
    this.conversationHistory = [...conversation.messages];
    this.displayConversation(conversation.messages);
  }

  /**
   * Display conversation messages in the UI
   */
  displayConversation(messages) {
    this.domManager.clear('chatMessages');

    messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const messageElement = MessageFactory.createMessageElement(msg.content, msg.role === 'user');
        this.domManager.appendChild('chatMessages', messageElement);
      }
    });

    this.scrollManager.scrollToBottomIfNeeded();
  }

  /**
   * Auto-resize textarea as content grows
   */
  autoResizeTextarea() {
    this.domManager.setStyle('chatInput', 'height', 'auto');
    const chatInput = this.domManager.getElement('chatInput');
    this.domManager.setStyle('chatInput', 'height', chatInput.scrollHeight + 'px');
  }

  /**
   * Handle Enter key for message submission
   */
  handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Load last conversation from storage
   */
  loadLastConversation() {
    const conversations = this.storageManager.getConversations();
    if (conversations.length > 0) {
      const lastConversation = conversations[0];
      this.conversationHistory = [...lastConversation.messages];
      this.displayConversation(lastConversation.messages);
    }
  }

  /**
   * Update saved prompts dropdown
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
}
