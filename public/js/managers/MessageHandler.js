/**
 * Message Handler
 * Handles message sending, receiving, and processing
 */

import { CONSTANTS } from '../utils/constants.js';
import { MessageFactory } from '../components/MessageFactory.js';
import { ThinkingProcessor } from '../components/ThinkingProcessor.js';

/**
 * Custom error for payload too large scenarios
 */
class PayloadTooLargeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

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
      window.chatApp.getManager('ui').updateSavedPromptsDropdown();
    }

    // Create and display user message
    const userMessageElement = MessageFactory.createMessageElement(message, true);
    this.domManager.appendChild('chatMessages', userMessageElement);
    
    // Clear input
    this.domManager.setValue('chatInput', '');
    this.domManager.setStyle('chatInput', 'height', 'auto');

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: message });

    // Create and show loading indicator
    const loadingElement = this.createLoadingIndicator();
    this.domManager.appendChild('chatMessages', loadingElement);

    // Enable auto-scroll and scroll to bottom
    this.scrollManager.enableAutoScroll();
    this.scrollManager.scrollToBottomIfNeeded();

    // Create bot response element (will replace loading indicator)
    const botResponseElement = MessageFactory.createMessageElement('', false);

    try {
      const response = await this.fetchStreamingResponse(message, selectedModel, systemPrompt);
      
      // Replace loading indicator with actual response element
      this.replaceLoadingWithResponse(loadingElement, botResponseElement);
      
      await this.handleStreamingResponse(response, botResponseElement, supportsThinking);
    } catch (error) {
      // Replace loading indicator with response element for error display
      this.replaceLoadingWithResponse(loadingElement, botResponseElement);
      
      if (error instanceof PayloadTooLargeError) {
        this.handlePayloadTooLargeError(error, botResponseElement);
      } else {
        this.handleError(error, botResponseElement);
      }
    }
  }

  /**
   * Fetch streaming response from server
   */
  async fetchStreamingResponse(message, model, systemPrompt) {
    try {
      const response = await fetch(CONSTANTS.ENDPOINTS.stream, {
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

      // Check for payload too large error
      if (response.status === 413) {
        const errorData = await response.json();
        if (errorData.code === 'PAYLOAD_TOO_LARGE') {
          throw new PayloadTooLargeError(errorData.message);
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        throw error;
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Handle streaming response from the server
   */
  async handleStreamingResponse(response, botResponseElement, supportsThinking) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let fullThinkingContent = '';

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
            
            // Handle different message types
            if (chunk.type === 'notification') {
              // Show notification to user
              if (window.chatApp && window.chatApp.getManager) {
                window.chatApp.getManager('ui').showNotification(chunk.message, 'info');
              }
            } else if (chunk.type === 'thinking' && supportsThinking) {
              // Handle thinking content
              fullThinkingContent += chunk.content;
              ThinkingProcessor.updateThinkingSection(botResponseElement, fullThinkingContent, false);
              this.scrollManager.scrollToBottomIfNeeded();
            } else if (chunk.message?.content) {
              // Handle regular message content
              fullResponse += chunk.message.content;
              this.updateBotMessage(botResponseElement, fullResponse);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }

    // Mark thinking as complete if any thinking content was received
    if (fullThinkingContent && supportsThinking) {
      ThinkingProcessor.updateThinkingSection(botResponseElement, fullThinkingContent, true);
    }

    // Finalize message
    this.finalizeMessage(botResponseElement, fullResponse);
  }

  /**
   * Update bot message during streaming
   */
  updateBotMessage(botResponseElement, fullResponse) {
    // Find or create regular content container
    const regularContentContainer = ThinkingProcessor.getRegularContentContainer(botResponseElement);

    // Update regular content
    if (regularContentContainer) {
      regularContentContainer.innerHTML = MessageFactory.processHTML(marked.parse(fullResponse));
    }

    // Scroll to bottom as new content arrives (respects shouldAutoScroll flag)
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
   * Handle payload too large errors with user-friendly message and options
   */
  handlePayloadTooLargeError(error, botResponseElement) {
    console.error('Payload too large:', error);
    
    // Create a more informative error message with options
    const errorContainer = document.createElement('div');
    errorContainer.className = 'payload-error-container';
    errorContainer.innerHTML = `
      <div class="error-message">
        <h4>⚠️ Conversation Too Long</h4>
        <p>The conversation history has become too large to process. You have a few options:</p>
        <div class="error-actions">
          <button class="btn btn-primary" onclick="window.chatApp.getManager('message').summarizeAndContinue()">
            📝 Summarize & Continue
          </button>
          <button class="btn btn-secondary" onclick="window.chatApp.reset()">
            🆕 Start New Conversation
          </button>
        </div>
        <p class="error-details">${error.message}</p>
      </div>
    `;
    
    // Clear bot response and add error container
    botResponseElement.innerHTML = '';
    botResponseElement.appendChild(errorContainer);
    
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
   * Summarize conversation and continue with the last message
   */
  async summarizeAndContinue() {
    if (this.conversationHistory.length === 0) {
      console.warn('No conversation to summarize');
      return;
    }

    try {
      // Get the last user message
      const lastUserMessage = [...this.conversationHistory].reverse().find(msg => msg.role === 'user');
      if (!lastUserMessage) {
        console.warn('No user message found to retry');
        return;
      }

      // Show loading message
      const loadingElement = this.createLoadingIndicator();
      loadingElement.querySelector('.typing-text').textContent = 'Summarizing conversation';
      this.domManager.appendChild('chatMessages', loadingElement);

      // Request server to handle summarization by making a new request
      // The server will automatically summarize if the conversation is too long
      const selectedModel = this.domManager.getValue('modelSelector');
      const systemPrompt = this.domManager.getValue('systemPromptInput').trim();

      // Retry the last message - server will handle summarization
      const response = await this.fetchStreamingResponse(lastUserMessage.content, selectedModel, systemPrompt);
      
      // Create new bot response element and replace loading indicator
      const botResponseElement = MessageFactory.createMessageElement('', false);
      this.replaceLoadingWithResponse(loadingElement, botResponseElement);

      // Handle the response
      const supportsThinking = CONSTANTS.isThinkingModel(selectedModel);
      await this.handleStreamingResponse(response, botResponseElement, supportsThinking);

    } catch (error) {
      console.error('Error during summarize and continue:', error);
      
      // Show error message
      const errorElement = MessageFactory.createMessageElement(
        'Failed to summarize conversation. Please try starting a new conversation.',
        false
      );
      this.domManager.appendChild('chatMessages', errorElement);
    }
  }

  /**
   * Create an animated loading indicator
   */
  createLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'message assistant message-loading';
    
    loadingElement.innerHTML = `
      <div class="typing-indicator">
        <span class="typing-text">AI is thinking</span>
        <div class="dot-animation">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
    
    return loadingElement;
  }

  /**
   * Replace loading indicator with actual response element
   */
  replaceLoadingWithResponse(loadingElement, responseElement) {
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.replaceChild(responseElement, loadingElement);
    } else {
      // Fallback: just add the response element
      this.domManager.appendChild('chatMessages', responseElement);
    }
  }
}
