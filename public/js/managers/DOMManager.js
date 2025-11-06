/**
 * DOM Manager
 * Handles DOM element selection and basic DOM operations
 */

import { CONSTANTS } from '../utils/constants.js';

export class DOMManager {
  constructor() {
    this.elements = {};
    this.initializeElements();
  }

  /**
   * Initialize all DOM elements
   */
  initializeElements() {
    Object.entries(CONSTANTS.SELECTORS).forEach(([key, selector]) => {
      this.elements[key] = document.querySelector(selector);
      if (!this.elements[key]) {
        console.warn(`Element not found: ${selector}`);
      }
    });
  }

  /**
   * Get a DOM element by key
   */
  getElement(key) {
    return this.elements[key];
  }

  /**
   * Query selector (for dynamic selection)
   */
  querySelector(selector) {
    return document.querySelector(selector);
  }

  /**
   * Query all selectors (for dynamic selection)
   */
  querySelectorAll(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Get all elements
   */
  getAllElements() {
    return this.elements;
  }

  /**
   * Add event listener to an element
   */
  addEventListener(elementKey, event, handler) {
    const element = this.getElement(elementKey);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  /**
   * Remove event listener from an element
   */
  removeEventListener(elementKey, event, handler) {
    const element = this.getElement(elementKey);
    if (element) {
      element.removeEventListener(event, handler);
    }
  }

  /**
   * Add CSS class to an element
   */
  addClass(elementKey, className) {
    const element = this.getElement(elementKey);
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * Remove CSS class from an element
   */
  removeClass(elementKey, className) {
    const element = this.getElement(elementKey);
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * Toggle CSS class on an element
   */
  toggleClass(elementKey, className) {
    const element = this.getElement(elementKey);
    if (element) {
      element.classList.toggle(className);
    }
  }

  /**
   * Check if element has a CSS class
   */
  hasClass(elementKey, className) {
    const element = this.getElement(elementKey);
    return element ? element.classList.contains(className) : false;
  }

  /**
   * Set element style
   */
  setStyle(elementKey, property, value) {
    const element = this.getElement(elementKey);
    if (element) {
      element.style[property] = value;
    }
  }

  /**
   * Get element style
   */
  getStyle(elementKey, property) {
    const element = this.getElement(elementKey);
    return element ? getComputedStyle(element)[property] : null;
  }

  /**
   * Set element text content
   */
  setText(elementKey, text) {
    const element = this.getElement(elementKey);
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Set element HTML content
   */
  setHTML(elementKey, html) {
    const element = this.getElement(elementKey);
    if (element) {
      element.innerHTML = html;
    }
  }

  /**
   * Get element value
   */
  getValue(elementKey) {
    const element = this.getElement(elementKey);
    return element ? element.value : null;
  }

  /**
   * Set element value
   */
  setValue(elementKey, value) {
    const element = this.getElement(elementKey);
    if (element) {
      element.value = value;
    }
  }

  /**
   * Clear element content
   */
  clear(elementKey) {
    const element = this.getElement(elementKey);
    if (element) {
      element.innerHTML = '';
    }
  }

  /**
   * Append child to element
   */
  appendChild(elementKey, child) {
    const element = this.getElement(elementKey);
    if (element) {
      element.appendChild(child);
    }
  }

  /**
   * Focus on an element
   */
  focus(elementKey) {
    const element = this.getElement(elementKey);
    if (element) {
      element.focus();
    }
  }

  /**
   * Get element offset height
   */
  getOffsetHeight(elementKey) {
    const element = this.getElement(elementKey);
    return element ? element.offsetHeight : 0;
  }

  /**
   * Get element scroll properties
   */
  getScrollProperties(elementKey) {
    const element = this.getElement(elementKey);
    if (!element) return null;

    return {
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    };
  }
}
