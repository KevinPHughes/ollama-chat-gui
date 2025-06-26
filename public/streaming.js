/**
 * Kevin's Chat Assistant - Main JavaScript
 *
 * This file handles the chat functionality, theme management,
 * and UI interactions for the chat assistant.
 */

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------------
  // INITIALIZATION AND DOM ELEMENTS
  // -------------------------------------------------------------

  // DOM element references
  const elements = {
    chatInput: document.getElementById("chatInput"),
    chatMessages: document.getElementById("chatMessages"),
    sendButton: document.getElementById("sendButton"),
    modelSelector: document.getElementById("modelSelector"),
    themeToggle: document.getElementById("themeToggle"),
    chatHeader: document.querySelector(".chat-header"),
    chatContainer: document.querySelector(".chat-container"),
    systemPromptToggle: document.getElementById("systemPromptToggle"),
    systemPromptPanel: document.getElementById("systemPromptPanel"),
    systemPromptInput: document.getElementById("systemPromptInput"),
    savedPromptsSelector: document.getElementById("savedPromptsSelector"),
    newConversationBtn: document.getElementById("newConversationBtn"),
    savedConversationsBtn: document.getElementById("savedConversationsBtn")
  };

  // App state
  const state = {
    conversationHistory: [],
    shouldAutoScroll: true,
    lastScrollTop: 0,
    headerHeight: elements.chatHeader.offsetHeight,
    scrollTimeout: null,
    isScrollHandlerActive: false
  };

  // Constants
  const SCROLL_THRESHOLD = 5;
  const MAX_SAVED_CONVERSATIONS = 10; // Limit number of saved conversations
  const MAX_SAVED_PROMPTS = 20; // Limit number of saved system prompts

  // Initialize app components
  initializeApp();

  // -------------------------------------------------------------
  // CORE INITIALIZATION
  // -------------------------------------------------------------

  /**
   * Initialize all application components
   */
  function initializeApp() {
    // Initialize theme system
    initializeTheme();

    // Configure markdown parser
    configureMarkdown();

    // Set up event listeners
    setupEventListeners();

    // Initialize UI
    initializeUI();

    // Load saved conversations and system prompts
    loadLastConversation();
    loadLastSystemPrompt();
  }

  /**
   * Set up all event listeners
   */
  function setupEventListeners() {
    // Input and submission events
    elements.sendButton.addEventListener("click", sendMessage);
    elements.chatInput.addEventListener("input", autoResizeTextarea);
    elements.chatInput.addEventListener("keydown", handleKeyDown);

    // Scroll events
    elements.chatMessages.addEventListener("scroll", handleChatScroll);

    // Window events
    window.addEventListener("load", handleWindowLoad);
    window.addEventListener("resize", handleWindowResize);

    // System prompt toggle
    elements.systemPromptToggle.addEventListener("click", toggleSystemPromptPanel);

    // New conversation button
    elements.newConversationBtn.addEventListener("click", startNewConversation);

    // Saved conversations button
    elements.savedConversationsBtn.addEventListener("click", showSavedConversations);

    // Saved prompts selector
    elements.savedPromptsSelector.addEventListener("change", loadSelectedPrompt);
  }

  /**
   * Toggle system prompt panel visibility
   */
  function toggleSystemPromptPanel() {
    elements.systemPromptPanel.classList.toggle("visible");
    elements.chatContainer.classList.toggle("with-system-prompt");

    // Adjust chat container and re-calculate heights
    if (elements.systemPromptPanel.classList.contains("visible")) {
      // Adjust spacing for open panel
      handleWindowResize();
    } else {
      // Reset spacing when closed
      handleWindowResize();
    }
  }

  // -------------------------------------------------------------
  // THEME MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Initialize theme based on user preference
   */
  function initializeTheme() {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Apply theme based on saved preference or system preference
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.body.classList.add("dark-theme");
    }

    // Add event listener to theme toggle button
    elements.themeToggle.addEventListener("click", () => {
      // Toggle dark theme class on body
      document.body.classList.toggle("dark-theme");

      // Save preference to localStorage
      const isDark = document.body.classList.contains("dark-theme");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    // Listen for system theme changes if no manual preference set
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        if (e.matches) {
          document.body.classList.add("dark-theme");
        } else {
          document.body.classList.remove("dark-theme");
        }
      }
    });
  }

  // -------------------------------------------------------------
  // SCROLL MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Check if user is at or near bottom of chat
   */
  function isNearBottom() {
    const container = elements.chatMessages;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= SCROLL_THRESHOLD;
  }

  /**
   * Scroll to bottom if auto-scroll is enabled
   */
  function scrollToBottomIfNeeded() {
    if (state.shouldAutoScroll) {
      elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
  }

  /**
   * Handle chat scroll events
   */
  function handleChatScroll() {
    const container = elements.chatMessages;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    // Toggle auto-scroll based on scroll position
    state.shouldAutoScroll = distanceFromBottom <= SCROLL_THRESHOLD;
  }

  /**
   * Debounced scroll handler for header show/hide
   */
  function handleScroll() {
    if (!state.isScrollHandlerActive) return;

    clearTimeout(state.scrollTimeout);
    state.scrollTimeout = setTimeout(() => {
      // Get current scroll position
      const st = elements.chatMessages.scrollTop;

      // Add a threshold to prevent triggering on tiny scroll changes
      const scrollDelta = Math.abs(st - state.lastScrollTop);

      if (scrollDelta < 5) return; // Ignore very small scroll movements

      // Determine scroll direction and position
      if (st <= 10) {
        // At the top - show header
        showHeader();
      } else if (st > state.lastScrollTop + 10) {
        // Scrolling down - hide header
        hideHeader();
      } else if (st < state.lastScrollTop - 30 && st < 150) {
        // Scrolling up near the top - show header
        showHeader();
      }

      // Update last scroll position
      state.lastScrollTop = st;

      // Update auto-scroll state
      const distanceFromBottom = elements.chatMessages.scrollHeight -
                                elements.chatMessages.scrollTop -
                                elements.chatMessages.clientHeight;
      state.shouldAutoScroll = distanceFromBottom <= SCROLL_THRESHOLD;
    }, 10); // Small timeout for performance
  }

  /**
   * Show the header
   */
  function showHeader() {
    elements.chatHeader.classList.remove("hidden");
    elements.chatContainer.classList.remove("header-hidden");
    elements.chatContainer.classList.add("header-visible");
    elements.chatContainer.style.paddingTop = state.headerHeight + "px";
  }

  /**
   * Hide the header
   */
  function hideHeader() {
    elements.chatHeader.classList.add("hidden");
    elements.chatContainer.classList.remove("header-visible");
    elements.chatContainer.classList.add("header-hidden");
    elements.chatContainer.style.paddingTop = "0";
  }

  // -------------------------------------------------------------
  // UI UTILITIES
  // -------------------------------------------------------------

  /**
   * Initialize UI elements
   */
  function initializeUI() {
    // Set initial state
    document.body.style.paddingTop = "0";
    elements.chatContainer.style.paddingTop = state.headerHeight + "px";

    // Focus chat input
    elements.chatInput.focus();
  }

  /**
   * Configure markdown parser
   */
  function configureMarkdown() {
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
      tables: true,
      smartLists: true,
      xhtml: true,
      highlight: function (code, lang) {
        return code;
      },
    });
  }

  /**
   * Auto-resize textarea as content grows
   */
  function autoResizeTextarea() {
    elements.chatInput.style.height = "auto";
    elements.chatInput.style.height = elements.chatInput.scrollHeight + "px";
  }

  /**
   * Format current time for message timestamps
   */
  function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * Handle Enter key for message submission
   */
  function handleKeyDown(event) {
    // Submit on Enter, but not when Shift is pressed
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  /**
   * Handle window load event
   */
  function handleWindowLoad() {
    // Force a reflow to ensure correct measurements
    state.headerHeight = elements.chatHeader.offsetHeight;
    elements.chatContainer.style.paddingTop = state.headerHeight + "px";

    // Delay activating scroll handler to avoid initial flickers
    setTimeout(() => {
      state.isScrollHandlerActive = true;
      // Add proper scroll event listener
      elements.chatMessages.addEventListener("scroll", handleScroll);
    }, 500);
  }

  /**
   * Handle window resize event
   */
  function handleWindowResize() {
    state.headerHeight = elements.chatHeader.offsetHeight;
    if (elements.chatContainer.classList.contains("header-visible")) {
      elements.chatContainer.style.paddingTop = state.headerHeight + "px";
    }

    // Adjust system prompt panel position if visible
    if (elements.systemPromptPanel.classList.contains("visible")) {
      const panelHeight = elements.systemPromptPanel.offsetHeight;
      elements.chatContainer.style.paddingTop = (state.headerHeight + panelHeight) + "px";
    }
  }

  // -------------------------------------------------------------
  // MESSAGE PROCESSING AND RENDERING
  // -------------------------------------------------------------

  /**
   * Create a message element
   */
  function createMessageElement(content, isUser) {
    const messageElement = document.createElement("div");
    messageElement.className = isUser ? "message user-message" : "message bot-message";

    // Create message content container
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    if (isUser) {
      messageContent.textContent = content;
    } else {
      // For bot messages, we'll use markdown parsing with our enhancements
      const rawHTML = marked.parse(content);
      messageContent.innerHTML = processHTML(rawHTML);
    }

    // Add message content to message element
    messageElement.appendChild(messageContent);

    // Add copy button
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "message-actions";

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy";

    // Save the original content that should be copied directly in a data attribute for later retrieval
    copyButton.dataset.content = content;

    copyButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      copyMessageContent(copyButton.dataset.content, copyButton);
    });

    actionsContainer.appendChild(copyButton);
    messageElement.appendChild(actionsContainer);

    // Create time element
    const timeElement = document.createElement("div");
    timeElement.className = "message-time";
    timeElement.textContent = formatTimestamp();
    messageElement.appendChild(timeElement);

    return messageElement;
  }

  /**
   * Copy message content to clipboard
   */
  function copyMessageContent(content, buttonElement) {
    // Copy text to clipboard
    navigator.clipboard.writeText(content).then(() => {
      // Show feedback
      const originalText = buttonElement.textContent;
      buttonElement.textContent = "Copied!";

      // Reset button text after 2 seconds
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
  function processHTML(html) {
    // Create a DOM parser to safely handle the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Find all tables and enhance them
    const tables = doc.querySelectorAll("table");
    tables.forEach((table) => {
      // Add responsive wrapper if needed
      if (!table.parentElement.classList.contains("table-responsive")) {
        const wrapper = document.createElement("div");
        wrapper.className = "table-responsive";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }

      // Make sure the first row is in a thead if not already
      if (!table.querySelector("thead") && table.rows.length > 0) {
        const thead = document.createElement("thead");
        thead.appendChild(table.rows[0]);
        table.insertBefore(thead, table.firstChild);
      }
    });

    // Remove excessive line breaks from text nodes
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);

    // Replace multiple consecutive line breaks with a single one
    let node;
    while ((node = walker.nextNode())) {
      node.textContent = node.textContent.replace(/\n\s*\n/g, "\n");
    }

    // Return the processed HTML
    return doc.body.innerHTML;
  }

  /**
   * Process thinking content for models that support it
   */
  function processThinkingContent(content, element, isDeepseekModel) {
    // Only process for the deepseek model
    if (!isDeepseekModel) {
      return content;
    }

    // Check if we have a thinking section
    const thinkStartTag = "<think>";
    const thinkEndTag = "</think>";
    const thinkStartIndex = content.indexOf(thinkStartTag);

    if (thinkStartIndex === -1) {
      return content; // No thinking section found
    }

    // Find the end of the thinking section
    const thinkEndIndex = content.indexOf(thinkEndTag, thinkStartIndex);
    let regularContent = "";

    // If we have a complete thinking section
    if (thinkEndIndex !== -1) {
      // Extract the thinking content
      const thinkingContent = content.substring(
        thinkStartIndex + thinkStartTag.length,
        thinkEndIndex
      );

      // Get content before and after the thinking tags
      const beforeThinking = content.substring(0, thinkStartIndex);
      const afterThinking = content.substring(thinkEndIndex + thinkEndTag.length);

      // Combine for regular content
      regularContent = beforeThinking + afterThinking;

      // Create or update the thinking section
      updateThinkingSection(element, thinkingContent, true);

      // Update the copy button to include the full content (without thinking part)
      const copyButton = element.querySelector('.copy-button');
      if (copyButton) {
        // Store the processed content (without thinking section) in the data attribute
        copyButton.dataset.content = regularContent;

        // Remove previous event listeners and add new one with correct content
        copyButton.replaceWith(copyButton.cloneNode(true));

        // Get the fresh reference
        const newCopyButton = element.querySelector('.copy-button');

        newCopyButton.addEventListener("click", (e) => {
          e.stopPropagation();
          copyMessageContent(regularContent, newCopyButton);
        });
      }
    }
    // If we have a partial thinking section (still in progress)
    else if (thinkStartIndex !== -1) {
      // Extract the thinking content so far
      const thinkingContent = content.substring(thinkStartIndex + thinkStartTag.length);

      // Only content before thinking tags is available yet
      regularContent = content.substring(0, thinkStartIndex);

      // Create or update the thinking section
      updateThinkingSection(element, thinkingContent, false);
    }

    return regularContent;
  }

  /**
   * Update the thinking section UI
   */
  function updateThinkingSection(parentElement, content, isComplete) {
    // Look for an existing response wrapper or create one
    let responseWrapper = parentElement.querySelector(".response-wrapper");
    if (!responseWrapper) {
      // First, save any existing timestamp
      const existingTimestamp = parentElement.querySelector(".message-time");

      // Save any existing actions
      const existingActions = parentElement.querySelector(".message-actions");

      // Save any existing content (except timestamps and actions)
      let existingContent = "";
      Array.from(parentElement.childNodes).forEach((node) => {
        if (!node.classList || (!node.classList.contains("message-time") && !node.classList.contains("message-actions"))) {
          existingContent += node.outerHTML || node.textContent;
        }
      });

      // Clear the parent (but do not remove it)
      parentElement.innerHTML = "";

      // Create wrapper for proper structure
      responseWrapper = document.createElement("div");
      responseWrapper.className = "response-wrapper";
      parentElement.appendChild(responseWrapper);

      // Add regular content container
      const regularContent = document.createElement("div");
      regularContent.className = "regular-content";
      regularContent.innerHTML = existingContent;
      responseWrapper.appendChild(regularContent);

      // Add actions back if they existed
      if (existingActions) {
        parentElement.appendChild(existingActions);
      }

      // Add timestamp back if it existed
      if (existingTimestamp) {
        parentElement.appendChild(existingTimestamp);
      }
    }

    // Look for an existing thinking section or create one
    let thinkingSection = responseWrapper.querySelector(".thinking-section");
    if (!thinkingSection) {
      thinkingSection = document.createElement("div");
      thinkingSection.className = "thinking-section";

      // Important: insert it before the regular content for better visual flow
      const regularContent = responseWrapper.querySelector(".regular-content");
      responseWrapper.insertBefore(thinkingSection, regularContent);
    }

    // Update the thinking content
    thinkingSection.innerHTML = marked.parse(content);

    // Add a class to indicate thinking is complete
    if (isComplete) {
      thinkingSection.classList.add("thinking-complete");
    } else {
      thinkingSection.classList.remove("thinking-complete");
    }
  }

  // -------------------------------------------------------------
  // MESSAGE SENDING AND RECEIVING
  // -------------------------------------------------------------

  /**
   * Send a message and process the response
   */
  async function sendMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;

    // Get selected model
    const selectedModel = elements.modelSelector.value;
    const isDeepseekModel = selectedModel === "deepseek-r1";

    // Get system prompt if provided
    const systemPrompt = elements.systemPromptInput.value.trim();

    // Save system prompt if it's new or different
    if (systemPrompt) {
      saveSystemPrompt(systemPrompt);
      updateSavedPromptsDropdown(); // Update dropdown after saving
    }

    // Create user message element
    const userMessageElement = createMessageElement(message, true);
    elements.chatMessages.appendChild(userMessageElement);
    elements.chatInput.value = "";

    // Reset textarea height
    elements.chatInput.style.height = "auto";

    // Add user message to history
    state.conversationHistory.push({ role: "user", content: message });

    // Create bot response element
    const botResponseElement = createMessageElement("", false);
    botResponseElement.classList.add("loading");
    elements.chatMessages.appendChild(botResponseElement);

    // Reset to true when sending a new message
    state.shouldAutoScroll = true;
    scrollToBottomIfNeeded();

    try {
      const response = await fetch("/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          messages: state.conversationHistory,
          model: selectedModel,
          systemPrompt: systemPrompt // Add system prompt to request
        }),
      });

      await handleStreamingResponse(response, botResponseElement, isDeepseekModel);

    } catch (error) {
      console.error("Error:", error);
      botResponseElement.textContent = "Error: Could not get a response";

      // Re-add the timestamp
      const timeElement = document.createElement("div");
      timeElement.className = "message-time";
      timeElement.textContent = formatTimestamp();
      botResponseElement.appendChild(timeElement);
    }
  }

  /**
   * Handle streaming response from the server
   */
  async function handleStreamingResponse(response, botResponseElement, isDeepseekModel) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    // Remove loading indicator
    botResponseElement.classList.remove("loading");

    // Process the streaming response
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.substring(6);
          if (data === "[DONE]") break;

          try {
            const chunk = JSON.parse(data);
            if (chunk.message?.content) {
              fullResponse += chunk.message.content;

              // Process thinking content for deepseek model
              const processedContent = processThinkingContent(
                fullResponse,
                botResponseElement,
                isDeepseekModel
              );

              // Find (or create) the regular content container
              let regularContentContainer = botResponseElement.querySelector(".regular-content");
              if (!regularContentContainer) {
                regularContentContainer = botResponseElement
                  .querySelector(".response-wrapper")
                  ?.querySelector(".regular-content");

                // If still not found and no response wrapper exists, use the whole element
                if (!regularContentContainer && !botResponseElement.querySelector(".response-wrapper")) {
                  regularContentContainer = botResponseElement;
                }
              }

              // Display the regular content (with thinking parts removed)
              if (regularContentContainer) {
                regularContentContainer.innerHTML = processHTML(marked.parse(processedContent));
              }

              // Scroll to bottom as new content arrives
              scrollToBottomIfNeeded();
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      }
    }

    // Save to conversation history first
    state.conversationHistory.push({ role: "assistant", content: fullResponse });

    // Update copy button content directly with the final response content
    const copyButton = botResponseElement.querySelector('.copy-button');
    if (copyButton) {
      // Set data content explicitly
      copyButton.dataset.content = fullResponse;

      // Create completely new button (simplest way to ensure clean event listeners)
      const newCopyButton = document.createElement('button');
      newCopyButton.className = 'copy-button';
      newCopyButton.textContent = 'Copy';
      newCopyButton.dataset.content = fullResponse;

      // Add direct event listener with the correct content
      newCopyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        copyMessageContent(fullResponse, newCopyButton);
      });

      // Replace old button
      copyButton.parentNode.replaceChild(newCopyButton, copyButton);
    }

    // Add timestamp AFTER updating button
    updateMessageTimestamp(botResponseElement);

    // Save conversation to localStorage
    saveConversation();
  }

  /**
   * Update the timestamp on a message
   */
  function updateMessageTimestamp(messageElement) {
    // AFTER streaming is complete, add/update the timestamp
    const existingTimeElements = messageElement.querySelectorAll(".message-time");
    existingTimeElements.forEach((el) => el.remove());

    const timeElement = document.createElement("div");
    timeElement.className = "message-time";
    timeElement.textContent = formatTimestamp();
    messageElement.appendChild(timeElement);
  }

  // -------------------------------------------------------------
  // LOCALSTORAGE MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Save current conversation to localStorage
   */
  function saveConversation() {
    if (state.conversationHistory.length === 0) return;

    const conversations = getSavedConversations();
    const timestamp = new Date().toISOString();
    const conversationTitle = generateConversationTitle();

    const newConversation = {
      id: timestamp,
      title: conversationTitle,
      messages: [...state.conversationHistory],
      timestamp: timestamp
    };

    // Add to beginning of array and limit size
    conversations.unshift(newConversation);
    if (conversations.length > MAX_SAVED_CONVERSATIONS) {
      conversations.splice(MAX_SAVED_CONVERSATIONS);
    }

    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }

  /**
   * Load saved conversations from localStorage
   */
  function getSavedConversations() {
    try {
      const saved = localStorage.getItem('chatConversations');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  /**
   * Generate a title for the conversation based on first user message
   */
  function generateConversationTitle() {
    const firstUserMessage = state.conversationHistory.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.slice(0, 40);
      return title.length < firstUserMessage.content.length ? title + '...' : title;
    }
    return 'New Conversation';
  }

  /**
   * Save system prompt to localStorage
   */
  function saveSystemPrompt(promptText) {
    if (!promptText.trim()) return;

    const savedPrompts = getSavedSystemPrompts();
    const timestamp = new Date().toISOString();
    const promptTitle = promptText.slice(0, 30) + (promptText.length > 30 ? '...' : '');

    const newPrompt = {
      id: timestamp,
      title: promptTitle,
      content: promptText,
      timestamp: timestamp
    };

    // Check if this exact prompt already exists
    const existingIndex = savedPrompts.findIndex(p => p.content === promptText);
    if (existingIndex !== -1) {
      // Update timestamp of existing prompt and move to top
      savedPrompts.splice(existingIndex, 1);
    }

    // Add to beginning and limit size
    savedPrompts.unshift(newPrompt);
    if (savedPrompts.length > MAX_SAVED_PROMPTS) {
      savedPrompts.splice(MAX_SAVED_PROMPTS);
    }

    localStorage.setItem('systemPrompts', JSON.stringify(savedPrompts));
  }

  /**
   * Load saved system prompts from localStorage
   */
  function getSavedSystemPrompts() {
    try {
      const saved = localStorage.getItem('systemPrompts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading system prompts:', error);
      return [];
    }
  }

  /**
   * Load conversation history from localStorage on page load
   */
  function loadLastConversation() {
    const conversations = getSavedConversations();
    if (conversations.length > 0) {
      // Load the most recent conversation
      const lastConversation = conversations[0];
      state.conversationHistory = [...lastConversation.messages];

      // Display the conversation in the UI
      displayLoadedConversation(lastConversation.messages);
    }
  }

  /**
   * Display loaded conversation messages in the UI
   */
  function displayLoadedConversation(messages) {
    elements.chatMessages.innerHTML = '';

    messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const messageElement = createMessageElement(msg.content, msg.role === 'user');
        elements.chatMessages.appendChild(messageElement);
      }
    });

    scrollToBottomIfNeeded();
  }

  /**
   * Clear current conversation and start fresh
   */
  function startNewConversation() {
    // Save current conversation before clearing
    if (state.conversationHistory.length > 0) {
      saveConversation();
    }

    // Clear conversation
    state.conversationHistory = [];
    elements.chatMessages.innerHTML = '';
  }

  /**
   * Load saved system prompt on page load
   */
  function loadLastSystemPrompt() {
    const savedPrompts = getSavedSystemPrompts();
    if (savedPrompts.length > 0) {
      // Load the most recent system prompt
      elements.systemPromptInput.value = savedPrompts[0].content;
    }

    // Populate saved prompts dropdown
    updateSavedPromptsDropdown();
  }

  /**
   * Update the saved prompts dropdown
   */
  function updateSavedPromptsDropdown() {
    const savedPrompts = getSavedSystemPrompts();
    elements.savedPromptsSelector.innerHTML = '<option value="">Load saved prompt...</option>';

    savedPrompts.forEach(prompt => {
      const option = document.createElement('option');
      option.value = prompt.id;
      option.textContent = prompt.title;
      elements.savedPromptsSelector.appendChild(option);
    });
  }

  /**
   * Load a selected prompt from the dropdown
   */
  function loadSelectedPrompt() {
    const selectedId = elements.savedPromptsSelector.value;
    if (!selectedId) return;

    const savedPrompts = getSavedSystemPrompts();
    const selectedPrompt = savedPrompts.find(p => p.id === selectedId);

    if (selectedPrompt) {
      elements.systemPromptInput.value = selectedPrompt.content;
    }
  }

  /**
   * Show saved conversations in a simple alert for now (can be enhanced later)
   */
  function showSavedConversations() {
    const conversations = getSavedConversations();

    if (conversations.length === 0) {
      alert('No saved conversations found.');
      return;
    }

    // Create a simple list to show conversations
    let conversationList = 'Saved Conversations:\n\n';
    conversations.forEach((conv, index) => {
      const date = new Date(conv.timestamp).toLocaleDateString();
      conversationList += `${index + 1}. ${conv.title} (${date})\n`;
    });

    conversationList += '\n(Future enhancement: Click to load conversation)';
    alert(conversationList);
  }
});
