/**
 * Message Factory
 * Creates and manages message DOM elements
 */

import { CONSTANTS } from '../utils/constants.js';
import { Utils } from '../utils/utils.js';

export class MessageFactory {
  /**
   * Create a message element
   */
  static createMessageElement(content, isUser) {
    const messageElement = document.createElement('div');
    messageElement.className = isUser 
      ? `${CONSTANTS.CSS_CLASSES.message} ${CONSTANTS.CSS_CLASSES.userMessage}`
      : `${CONSTANTS.CSS_CLASSES.message} ${CONSTANTS.CSS_CLASSES.botMessage}`;

    // Create message content container
    const messageContent = document.createElement('div');
    messageContent.className = CONSTANTS.CSS_CLASSES.messageContent;

    if (isUser) {
      messageContent.textContent = content;
    } else {
      // For bot messages, we'll use markdown parsing
      const rawHTML = marked.parse(content);
      messageContent.innerHTML = this.processHTML(rawHTML);
    }

    // Add message content to message element
    messageElement.appendChild(messageContent);

    // Add action buttons
    const actionsContainer = this.createActionButtons(content);
    messageElement.appendChild(actionsContainer);

    // Add timestamp
    const timeElement = this.createTimestamp();
    messageElement.appendChild(timeElement);

    return messageElement;
  }

  /**
   * Create action buttons for messages
   */
  static createActionButtons(content) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = CONSTANTS.CSS_CLASSES.messageActions;

    const copyButton = document.createElement('button');
    copyButton.className = CONSTANTS.CSS_CLASSES.copyButton;
    copyButton.textContent = 'Copy';
    copyButton.dataset.content = content;

    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyMessageContent(content, copyButton);
    });

    actionsContainer.appendChild(copyButton);
    return actionsContainer;
  }

  /**
   * Create timestamp element
   */
  static createTimestamp() {
    const timeElement = document.createElement('div');
    timeElement.className = CONSTANTS.CSS_CLASSES.messageTime;
    timeElement.textContent = Utils.formatTimestamp();
    return timeElement;
  }

  /**
   * Copy message content to clipboard
   */
  static copyMessageContent(content, buttonElement) {
    navigator.clipboard.writeText(content).then(() => {
      const originalText = buttonElement.textContent;
      buttonElement.textContent = 'Copied!';

      setTimeout(() => {
        buttonElement.textContent = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  /**
   * Process HTML content for safety and enhancements
   */
  static processHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Enhance tables
    this.enhanceTables(doc);

    // Clean up text nodes
    this.cleanupTextNodes(doc);

    return doc.body.innerHTML;
  }

  /**
   * Enhance tables with responsive wrappers and headers
   */
  static enhanceTables(doc) {
    const tables = doc.querySelectorAll('table');
    tables.forEach((table) => {
      // Add responsive wrapper if needed
      if (!table.parentElement.classList.contains(CONSTANTS.CSS_CLASSES.tableResponsive)) {
        const wrapper = document.createElement('div');
        wrapper.className = CONSTANTS.CSS_CLASSES.tableResponsive;
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }

      // Make sure the first row is in a thead if not already
      if (!table.querySelector('thead') && table.rows.length > 0) {
        const thead = document.createElement('thead');
        thead.appendChild(table.rows[0]);
        table.insertBefore(thead, table.firstChild);
      }
    });
  }

  /**
   * Clean up excessive line breaks in text nodes
   */
  static cleanupTextNodes(doc) {
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      node.textContent = node.textContent.replace(/\n\s*\n/g, '\n');
    }
  }

  /**
   * Update message timestamp
   */
  static updateMessageTimestamp(messageElement) {
    // Remove existing timestamps
    const existingTimeElements = messageElement.querySelectorAll(`.${CONSTANTS.CSS_CLASSES.messageTime}`);
    existingTimeElements.forEach((el) => el.remove());

    // Add new timestamp
    const timeElement = this.createTimestamp();
    messageElement.appendChild(timeElement);
  }

  /**
   * Update copy button content
   */
  static updateCopyButton(messageElement, content) {
    const copyButton = messageElement.querySelector(`.${CONSTANTS.CSS_CLASSES.copyButton}`);
    if (copyButton) {
      // Clone button to remove existing event listeners
      const newCopyButton = copyButton.cloneNode(true);
      newCopyButton.dataset.content = content;

      // Add fresh event listener
      newCopyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyMessageContent(content, newCopyButton);
      });

      // Replace the old button
      copyButton.parentNode.replaceChild(newCopyButton, copyButton);
    }
  }
}
