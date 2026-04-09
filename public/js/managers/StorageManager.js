/**
 * Storage Manager
 * Handles all localStorage operations
 */

import { CONSTANTS } from '../utils/constants.js';
import { CONFIG } from '../config/config.js';
import { Utils } from '../utils/utils.js';

export class StorageManager {
  /**
   * Save conversations to localStorage
   */
  static saveConversations(conversations) {
    try {
      // Limit the number of conversations
      const limitedConversations = conversations.slice(0, CONFIG.STORAGE.maxConversations);
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.conversations, JSON.stringify(limitedConversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }

  /**
   * Get conversations from localStorage
   */
  static getConversations() {
    try {
      const saved = localStorage.getItem(CONSTANTS.STORAGE_KEYS.conversations);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  /**
   * Save a single conversation
   */
  static saveConversation(conversationHistory) {
    if (conversationHistory.length === 0) return;

    const conversations = this.getConversations();
    const timestamp = Utils.createId();
    const conversationTitle = Utils.generateConversationTitle(conversationHistory);

    const newConversation = {
      id: timestamp,
      title: conversationTitle,
      messages: Utils.deepClone(conversationHistory),
      timestamp: timestamp
    };

    // Add to beginning of array
    conversations.unshift(newConversation);
    this.saveConversations(conversations);
  }

  /**
   * Save system prompts to localStorage
   */
  static saveSystemPrompts(prompts) {
    try {
      // Limit the number of prompts
      const limitedPrompts = prompts.slice(0, CONFIG.STORAGE.maxSystemPrompts);
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.systemPrompts, JSON.stringify(limitedPrompts));
    } catch (error) {
      console.error('Error saving system prompts:', error);
    }
  }

  /**
   * Get system prompts from localStorage
   */
  static getSystemPrompts() {
    try {
      const saved = localStorage.getItem(CONSTANTS.STORAGE_KEYS.systemPrompts);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading system prompts:', error);
      return [];
    }
  }

  /**
   * Save a single system prompt
   */
  static saveSystemPrompt(promptText) {
    if (!promptText.trim()) return;

    const savedPrompts = this.getSystemPrompts();
    const timestamp = Utils.createId();
    const promptTitle = Utils.generateSystemPromptTitle(promptText);

    const newPrompt = {
      id: timestamp,
      title: promptTitle,
      content: promptText,
      timestamp: timestamp
    };

    // Check if this exact prompt already exists
    const existingIndex = savedPrompts.findIndex(p => p.content === promptText);
    if (existingIndex !== -1) {
      // Remove existing prompt to avoid duplicates
      savedPrompts.splice(existingIndex, 1);
    }

    // Add to beginning
    savedPrompts.unshift(newPrompt);
    this.saveSystemPrompts(savedPrompts);
  }

  /**
   * Get system prompt by ID
   */
  static getSystemPromptById(id) {
    const prompts = this.getSystemPrompts();
    return prompts.find(p => p.id === id);
  }

  /**
   * Save theme preference
   */
  static saveTheme(theme) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.theme, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  /**
   * Get theme preference
   */
  static getTheme() {
    try {
      return localStorage.getItem(CONSTANTS.STORAGE_KEYS.theme);
    } catch (error) {
      console.error('Error loading theme:', error);
      return null;
    }
  }

  /**
   * Clear all stored data
   */
  static clearAll() {
    try {
      Object.values(CONSTANTS.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Save application settings
   */
  static saveSettings(settings) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Get application settings
   */
  static getSettings() {
    try {
      const saved = localStorage.getItem(CONSTANTS.STORAGE_KEYS.settings);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  /**
   * Set a specific setting
   */
  static setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  }

  /**
   * Get a specific setting with default value
   */
  static getSetting(key, defaultValue = null) {
    const settings = this.getSettings();
    return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo() {
    const conversations = this.getConversations();
    const systemPrompts = this.getSystemPrompts();
    
    return {
      conversationCount: conversations.length,
      systemPromptCount: systemPrompts.length,
      hasTheme: !!this.getTheme()
    };
  }
}
