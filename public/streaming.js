document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const sendButton = document.getElementById('sendButton');
  const modelSelector = document.getElementById('modelSelector');

  // Initialize conversation history array
  let conversationHistory = [];

  // Flag to track if we should auto-scroll
  let shouldAutoScroll = true;

  // Threshold in pixels to determine if user is "near" the bottom
  const SCROLL_THRESHOLD = 50;

  // Check if user is near bottom of chat
  function isNearBottom() {
    const container = chatMessages;
    return container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD;
  }

  // Function to scroll to bottom if needed
  function scrollToBottomIfNeeded() {
    if (shouldAutoScroll) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Add scroll event listener to detect manual scrolling
  chatMessages.addEventListener('scroll', () => {
    // Update auto-scroll flag based on scroll position
    shouldAutoScroll = isNearBottom();
  });

  // Configure marked with better options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert line breaks to <br>
    tables: true,
    smartLists: true,
    xhtml: true,
    highlight: function(code, lang) {
      return code;
    }
  });

  // Auto-resize textarea as content grows
  function autoResizeTextarea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
  }

  // Initialize the textarea height
  chatInput.addEventListener('input', autoResizeTextarea);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Process HTML content for safety and enhancements
  const processHTML = (html) => {
    // Create a DOM parser to safely handle the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all tables and enhance them
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
      // Add responsive wrapper if needed
      if (!table.parentElement.classList.contains('table-responsive')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
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

    // Remove excessive line breaks from text nodes
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    // Replace multiple consecutive line breaks with a single one
    let node;
    while (node = walker.nextNode()) {
      node.textContent = node.textContent.replace(/\n\s*\n/g, '\n');
    }

    // Return the processed HTML
    return doc.body.innerHTML;
  };

  const createMessageElement = (content, isUser) => {
    const messageElement = document.createElement('div');
    messageElement.className = isUser ? 'message user-message' : 'message bot-message';

    // Create time element
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = formatTimestamp();

    if (isUser) {
      messageElement.textContent = content;
    } else {
      // For bot messages, we'll use markdown parsing with our enhancements
      const rawHTML = marked.parse(content);
      messageElement.innerHTML = processHTML(rawHTML);
    }

    messageElement.appendChild(timeElement);
    return messageElement;
  };

  const handleKeyDown = async (event) => {
    // Submit on Enter, but not when Shift is pressed
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendMessage();
    }
  };

  sendButton.addEventListener('click', sendMessage);

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Get selected model
    const selectedModel = modelSelector.value;

    // Create user message element
    const userMessageElement = createMessageElement(message, true);
    chatMessages.appendChild(userMessageElement);
    chatInput.value = '';

    // Reset textarea height
    chatInput.style.height = 'auto';

    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });

    // Create bot response element
    const botResponseElement = createMessageElement('', false);
    botResponseElement.classList.add('loading');
    chatMessages.appendChild(botResponseElement);

    // Reset to true when sending a new message
    shouldAutoScroll = true;
    scrollToBottomIfNeeded();

    try {
      const response = await fetch('/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          messages: conversationHistory,
          model: selectedModel // Send the selected model to the server
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      // Remove loading indicator
      botResponseElement.classList.remove('loading');

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
                botResponseElement.innerHTML = processHTML(marked.parse(fullResponse));

                // Re-add the timestamp which might have been overwritten
                const timeElement = document.createElement('div');
                timeElement.className = 'message-time';
                timeElement.textContent = formatTimestamp();
                botResponseElement.appendChild(timeElement);

                // Scroll to bottom as new content arrives
                scrollToBottomIfNeeded();
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Add assistant's response to history
      conversationHistory.push({ role: 'assistant', content: fullResponse });

    } catch (error) {
      console.error('Error:', error);
      botResponseElement.textContent = 'Error: Could not get a response';

      // Re-add the timestamp
      const timeElement = document.createElement('div');
      timeElement.className = 'message-time';
      timeElement.textContent = formatTimestamp();
      botResponseElement.appendChild(timeElement);
    }
  }

  // Replace keypress with keydown for better control over key combinations
  chatInput.addEventListener('keydown', handleKeyDown);

  // Focus input field when page loads
  chatInput.focus();
});