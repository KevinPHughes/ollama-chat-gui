/**
 * Scroll Manager
 * Handles scroll behavior, auto-scroll, and header show/hide
 */

import { CONSTANTS } from '../utils/constants.js';
import { Utils } from '../utils/utils.js';

export class ScrollManager {
  constructor(domManager) {
    this.domManager = domManager;
    this.shouldAutoScroll = true;
    this.lastScrollTop = 0;
    this.headerHeight = 0;
    this.scrollTimeout = null;
    this.isScrollHandlerActive = false;
    
    this.initialize();
  }

  /**
   * Initialize scroll management
   */
  initialize() {
    this.calculateHeaderHeight();
    this.setupEventListeners();
    this.initializeHeaderState();
    this.setupScrollToTop();
  }

  /**
   * Calculate and cache header height
   */
  calculateHeaderHeight() {
    this.headerHeight = this.domManager.getOffsetHeight('chatHeader');
  }

  /**
   * Set up scroll event listeners
   */
  setupEventListeners() {
    // Chat scroll for auto-scroll detection
    this.domManager.addEventListener('chatMessages', 'scroll', () => {
      this.handleChatScroll();
    });

    // Debounced scroll handler for header show/hide
    const debouncedHeaderScroll = Utils.debounce(() => {
      this.handleHeaderScroll();
    }, 10);

    this.domManager.addEventListener('chatMessages', 'scroll', debouncedHeaderScroll);

    // Window resize
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Window load - activate scroll handler after delay
    window.addEventListener('load', () => {
      this.handleWindowLoad();
    });
  }

  /**
   * Initialize header state
   */
  initializeHeaderState() {
    this.showHeader();
    this.domManager.setStyle('chatContainer', 'paddingTop', this.headerHeight + 'px');
  }

  /**
   * Handle chat scroll for auto-scroll detection
   */
  handleChatScroll() {
    const { scrollHeight, scrollTop, clientHeight } = this.domManager.getScrollProperties('chatMessages');
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Toggle auto-scroll based on scroll position
    this.shouldAutoScroll = distanceFromBottom <= CONSTANTS.SCROLL_THRESHOLD;
  }

  /**
   * Handle header show/hide based on scroll
   */
  handleHeaderScroll() {
    if (!this.isScrollHandlerActive) return;

    const { scrollTop } = this.domManager.getScrollProperties('chatMessages');
    const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);

    if (scrollDelta < 5) return; // Ignore very small scroll movements

    // Determine scroll direction and position
    if (scrollTop <= 10) {
      // At the top - show header
      this.showHeader();
    } else if (scrollTop > this.lastScrollTop + 10) {
      // Scrolling down - hide header
      this.hideHeader();
    } else if (scrollTop < this.lastScrollTop - 30 && scrollTop < 150) {
      // Scrolling up near the top - show header
      this.showHeader();
    }

    // Update last scroll position
    this.lastScrollTop = scrollTop;
  }

  /**
   * Show the header
   */
  showHeader() {
    this.domManager.removeClass('chatHeader', CONSTANTS.CSS_CLASSES.hidden);
    this.domManager.removeClass('chatContainer', CONSTANTS.CSS_CLASSES.headerHidden);
    this.domManager.addClass('chatContainer', CONSTANTS.CSS_CLASSES.headerVisible);
    this.domManager.setStyle('chatContainer', 'paddingTop', this.headerHeight + 'px');
  }

  /**
   * Hide the header
   */
  hideHeader() {
    this.domManager.addClass('chatHeader', CONSTANTS.CSS_CLASSES.hidden);
    this.domManager.removeClass('chatContainer', CONSTANTS.CSS_CLASSES.headerVisible);
    this.domManager.addClass('chatContainer', CONSTANTS.CSS_CLASSES.headerHidden);
    this.domManager.setStyle('chatContainer', 'paddingTop', '0');
  }

  /**
   * Check if user is at or near bottom of chat
   */
  isNearBottom() {
    const { scrollHeight, scrollTop, clientHeight } = this.domManager.getScrollProperties('chatMessages');
    return scrollHeight - scrollTop - clientHeight <= CONSTANTS.SCROLL_THRESHOLD;
  }

  /**
   * Scroll to bottom if auto-scroll is enabled
   */
  scrollToBottomIfNeeded() {
    if (this.shouldAutoScroll) {
      const chatMessages = this.domManager.getElement('chatMessages');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  /**
   * Force scroll to bottom
   */
  scrollToBottom() {
    const chatMessages = this.domManager.getElement('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Enable auto-scroll
   */
  enableAutoScroll() {
    this.shouldAutoScroll = true;
  }

  /**
   * Handle window load event
   */
  handleWindowLoad() {
    // Force a reflow to ensure correct measurements
    this.calculateHeaderHeight();
    this.domManager.setStyle('chatContainer', 'paddingTop', this.headerHeight + 'px');

    // Delay activating scroll handler to avoid initial flickers
    setTimeout(() => {
      this.isScrollHandlerActive = true;
    }, 500);
  }

  /**
   * Handle window resize event
   */
  handleWindowResize() {
    this.calculateHeaderHeight();
    
    if (this.domManager.hasClass('chatContainer', CONSTANTS.CSS_CLASSES.headerVisible)) {
      this.domManager.setStyle('chatContainer', 'paddingTop', this.headerHeight + 'px');
    }

    // Adjust for system prompt panel if visible
    if (this.domManager.hasClass('systemPromptPanel', CONSTANTS.CSS_CLASSES.visible)) {
      const panelHeight = this.domManager.getOffsetHeight('systemPromptPanel');
      this.domManager.setStyle('chatContainer', 'paddingTop', (this.headerHeight + panelHeight) + 'px');
    }
  }

  /**
   * Get current scroll state
   */
  getScrollState() {
    return {
      shouldAutoScroll: this.shouldAutoScroll,
      lastScrollTop: this.lastScrollTop,
      isNearBottom: this.isNearBottom(),
      isScrollHandlerActive: this.isScrollHandlerActive
    };
  }

  /**
   * Setup scroll-to-top button functionality
   */
  setupScrollToTop() {
    const scrollToTopBtn = this.domManager.getElement('scrollToTop');
    if (!scrollToTopBtn) return;

    // Show/hide button based on scroll position
    this.domManager.addEventListener('chatMessages', 'scroll', () => {
      const chatMessages = this.domManager.getElement('chatMessages');
      const shouldShow = chatMessages.scrollTop > 300; // Show after scrolling 300px
      
      if (shouldShow) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });

    // Handle button click
    this.domManager.addEventListener('scrollToTop', 'click', () => {
      this.scrollToTop();
    });
  }

  /**
   * Scroll to top of chat messages with smooth animation
   */
  scrollToTop() {
    const chatMessages = this.domManager.getElement('chatMessages');
    if (chatMessages) {
      chatMessages.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Temporarily disable auto-scroll to prevent interference
      this.disableAutoScroll();
      setTimeout(() => {
        this.enableAutoScroll();
      }, 1000); // Re-enable after scroll animation completes
    }
  }
}
