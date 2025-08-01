/**
 * Thinking Processor
 * Handles processing of thinking content for models that support it
 */

import { CONSTANTS } from '../utils/constants.js';
import { Utils } from '../utils/utils.js';

export class ThinkingProcessor {
  /**
   * Process thinking content for supported models
   */
  static processThinkingContent(content, element, isDeepseekModel) {
    if (!isDeepseekModel || !Utils.hasThinkingTags(content)) {
      return content;
    }

    const { regularContent, thinkingContent, isComplete } = Utils.extractThinkingContent(content);
    
    // Create or update the thinking section
    this.updateThinkingSection(element, thinkingContent, isComplete);

    return regularContent;
  }

  /**
   * Update the thinking section UI
   */
  static updateThinkingSection(parentElement, content, isComplete) {
    // Look for or create response wrapper
    let responseWrapper = this.getOrCreateResponseWrapper(parentElement);

    // Look for or create thinking section
    let thinkingSection = this.getOrCreateThinkingSection(responseWrapper);

    // Update the thinking content
    thinkingSection.innerHTML = marked.parse(content);

    // Update completion state
    if (isComplete) {
      thinkingSection.classList.add(CONSTANTS.CSS_CLASSES.thinkingComplete);
    } else {
      thinkingSection.classList.remove(CONSTANTS.CSS_CLASSES.thinkingComplete);
    }
  }

  /**
   * Get or create response wrapper
   */
  static getOrCreateResponseWrapper(parentElement) {
    let responseWrapper = parentElement.querySelector(`.${CONSTANTS.CSS_CLASSES.responseWrapper}`);
    
    if (!responseWrapper) {
      responseWrapper = this.createResponseWrapper(parentElement);
    }

    return responseWrapper;
  }

  /**
   * Create response wrapper and reorganize existing content
   */
  static createResponseWrapper(parentElement) {
    // Save existing elements
    const existingTimestamp = parentElement.querySelector(`.${CONSTANTS.CSS_CLASSES.messageTime}`);
    const existingActions = parentElement.querySelector(`.${CONSTANTS.CSS_CLASSES.messageActions}`);

    // Save existing content (excluding timestamps and actions)
    let existingContent = '';
    Array.from(parentElement.childNodes).forEach((node) => {
      if (!node.classList || 
          (!node.classList.contains(CONSTANTS.CSS_CLASSES.messageTime) && 
           !node.classList.contains(CONSTANTS.CSS_CLASSES.messageActions))) {
        existingContent += node.outerHTML || node.textContent;
      }
    });

    // Clear the parent
    parentElement.innerHTML = '';

    // Create wrapper
    const responseWrapper = document.createElement('div');
    responseWrapper.className = CONSTANTS.CSS_CLASSES.responseWrapper;
    parentElement.appendChild(responseWrapper);

    // Add regular content container
    const regularContent = document.createElement('div');
    regularContent.className = CONSTANTS.CSS_CLASSES.regularContent;
    regularContent.innerHTML = existingContent;
    responseWrapper.appendChild(regularContent);

    // Restore actions and timestamp
    if (existingActions) {
      parentElement.appendChild(existingActions);
    }
    if (existingTimestamp) {
      parentElement.appendChild(existingTimestamp);
    }

    return responseWrapper;
  }

  /**
   * Get or create thinking section
   */
  static getOrCreateThinkingSection(responseWrapper) {
    let thinkingSection = responseWrapper.querySelector(`.${CONSTANTS.CSS_CLASSES.thinkingSection}`);
    
    if (!thinkingSection) {
      thinkingSection = document.createElement('div');
      thinkingSection.className = CONSTANTS.CSS_CLASSES.thinkingSection;

      // Insert before regular content for better visual flow
      const regularContent = responseWrapper.querySelector(`.${CONSTANTS.CSS_CLASSES.regularContent}`);
      responseWrapper.insertBefore(thinkingSection, regularContent);
    }

    return thinkingSection;
  }

  /**
   * Get regular content container from element
   */
  static getRegularContentContainer(element) {
    let regularContentContainer = element.querySelector(`.${CONSTANTS.CSS_CLASSES.regularContent}`);
    
    if (!regularContentContainer) {
      regularContentContainer = element
        .querySelector(`.${CONSTANTS.CSS_CLASSES.responseWrapper}`)
        ?.querySelector(`.${CONSTANTS.CSS_CLASSES.regularContent}`);

      // If still not found and no response wrapper exists, use the whole element
      if (!regularContentContainer && !element.querySelector(`.${CONSTANTS.CSS_CLASSES.responseWrapper}`)) {
        regularContentContainer = element;
      }
    }

    return regularContentContainer;
  }
}
