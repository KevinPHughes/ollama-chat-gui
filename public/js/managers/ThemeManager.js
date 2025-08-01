/**
 * Theme Manager
 * Handles theme switching and system theme detection
 */

import { CONSTANTS } from '../utils/constants.js';
import { StorageManager } from './StorageManager.js';

export class ThemeManager {
  constructor(domManager) {
    this.domManager = domManager;
    this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.initialize();
  }

  /**
   * Initialize theme system
   */
  initialize() {
    this.loadSavedTheme();
    this.setupEventListeners();
    this.watchSystemTheme();
  }

  /**
   * Load saved theme or apply system preference
   */
  loadSavedTheme() {
    const savedTheme = StorageManager.getTheme();
    const prefersDark = this.systemMediaQuery.matches;

    // Apply theme based on saved preference or system preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.setDarkTheme(true);
    } else {
      this.setDarkTheme(false);
    }
  }

  /**
   * Set up theme toggle event listener
   */
  setupEventListeners() {
    this.domManager.addEventListener('themeToggle', 'click', () => {
      this.toggleTheme();
    });
  }

  /**
   * Watch for system theme changes
   */
  watchSystemTheme() {
    this.systemMediaQuery.addEventListener('change', (e) => {
      // Only apply system theme if no manual preference is set
      if (!StorageManager.getTheme()) {
        this.setDarkTheme(e.matches);
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const isDarkCurrently = this.isDarkTheme();
    const newTheme = !isDarkCurrently;
    
    this.setDarkTheme(newTheme);
    StorageManager.saveTheme(newTheme ? 'dark' : 'light');
  }

  /**
   * Set dark theme on/off
   */
  setDarkTheme(isDark) {
    if (isDark) {
      document.body.classList.add(CONSTANTS.CSS_CLASSES.darkTheme);
    } else {
      document.body.classList.remove(CONSTANTS.CSS_CLASSES.darkTheme);
    }
  }

  /**
   * Check if currently using dark theme
   */
  isDarkTheme() {
    return document.body.classList.contains(CONSTANTS.CSS_CLASSES.darkTheme);
  }

  /**
   * Get current theme preference
   */
  getCurrentTheme() {
    return this.isDarkTheme() ? 'dark' : 'light';
  }

  /**
   * Reset to system theme
   */
  resetToSystemTheme() {
    StorageManager.saveTheme(null);
    this.setDarkTheme(this.systemMediaQuery.matches);
  }

  /**
   * Check if system prefers dark theme
   */
  systemPrefersDark() {
    return this.systemMediaQuery.matches;
  }
}
