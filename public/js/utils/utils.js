/**
 * Utility Functions
 * Common utility functions used across the application
 */

export class Utils {
  /**
   * Format current time for message timestamps
   */
  static formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * Generate a title for the conversation based on first user message
   */
  static generateConversationTitle(conversationHistory) {
    const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.slice(0, 40);
      return title.length < firstUserMessage.content.length ? title + '...' : title;
    }
    return 'New Conversation';
  }

  /**
   * Generate a title for system prompt
   */
  static generateSystemPromptTitle(promptText) {
    return promptText.slice(0, 30) + (promptText.length > 30 ? '...' : '');
  }

  /**
   * Debounce function to limit function calls
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Deep clone an object or array
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }



  /**
   * Safely parse JSON with fallback
   */
  static safeJsonParse(jsonString, fallback = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return fallback;
    }
  }

  /**
   * Create a unique ID based on timestamp
   */
  static createId() {
    return new Date().toISOString();
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  /**
   * Format date for display
   */
  static formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
