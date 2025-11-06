import express from 'express';
import ollama from 'ollama';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001; // Or any port you prefer

// Increase payload limits to handle large conversation histories
app.use(express.json({ limit: '50mb' })); // Increased from default 100kb to 50mb
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public', { index: false }));

// Utility function to estimate token count (rough approximation)
function estimateTokenCount(messages) {
  return messages.reduce((total, msg) => {
    // Rough estimate: 1 token per 4 characters
    return total + Math.ceil(msg.content.length / 4);
  }, 0);
}

// Format milliseconds as seconds and minutes
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${min}m ${remSec}s`;
}

// Function to summarize conversation history
async function summarizeConversation(messages, model) {
  try {
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const summaryPrompt = `Please provide a concise summary of the following conversation, preserving the key context and important details that would be needed to continue the conversation naturally:

${conversationText}

Summary:`;
    console.log("summarizing using model: ", model || 'gemma2')
    const response = await ollama.chat({
      model: model || 'gemma2',
      messages: [{ role: 'user', content: summaryPrompt }],
    });

    return response.message.content;
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return 'Previous conversation summary unavailable.';
  }
}

// Function to manage conversation length
async function manageConversationLength(messages, model, maxTokens = 8000) {
  const estimatedTokens = estimateTokenCount(messages);
  
  if (estimatedTokens <= maxTokens) {
    return messages;
  }

  console.log(`Conversation too long (${estimatedTokens} tokens), summarizing...`);

  // Keep system prompt if it exists
  const systemPrompt = messages.find(msg => msg.role === 'system');
  
  // Find a good split point (keep recent messages)
  const recentMessageCount = Math.min(10, Math.floor(messages.length / 2));
  const messagesToSummarize = messages.filter(msg => msg.role !== 'system').slice(0, -recentMessageCount);
  const recentMessages = messages.filter(msg => msg.role !== 'system').slice(-recentMessageCount);

  if (messagesToSummarize.length === 0) {
    return messages; // Nothing to summarize
  }

  // Create summary
  const summary = await summarizeConversation(messagesToSummarize, model);
  
  // Build new message array
  const managedMessages = [];
  
  if (systemPrompt) {
    managedMessages.push(systemPrompt);
  }
  
  managedMessages.push({
    role: 'assistant',
    content: `[Previous conversation summary: ${summary}]`
  });
  
  managedMessages.push(...recentMessages);

  console.log(`Conversation reduced from ${messages.length} to ${managedMessages.length} messages`);
  return managedMessages;
}

// Now this will work
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'streaming.html'));
});


// Error handling middleware for payload too large
app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    console.error('Payload too large error:', error);
    return res.status(413).json({ 
      error: 'PayloadTooLarge',
      message: 'The conversation history is too large. Please start a new conversation or the system will automatically summarize the history.',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  next(error);
});

app.post('/stream', async (req, res) => {
  const startTime = Date.now();
  let firstChunkTime = null;
  let firstThinkingTime = null;
  let lastThinkingTime = null;
  const { message, messages, model, systemPrompt } = req.body;

  if (!message && !messages) {
    return res.status(400).json({ error: 'Message or messages are required' });
  }

  try {
    // Use provided message history or create a simple one with the current message
    let messageHistory = messages || [{ role: 'user', content: message }];

    // Add system prompt if provided
    if (systemPrompt && systemPrompt.trim() !== '') {
      // Insert system prompt at the beginning of the messages array
      messageHistory = [
        { role: 'system', content: systemPrompt },
        ...messageHistory
      ];
    }

    // Use specified model or default to gemma3
    const modelToUse = model || 'gemma3';

    // Manage conversation length to prevent payload too large errors
    const originalLength = messageHistory.length;
    messageHistory = await manageConversationLength(messageHistory, modelToUse);
    
    // Set headers FIRST before any response writing
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Notify client if conversation was summarized
    if (messageHistory.length < originalLength) {
      res.write(`data: ${JSON.stringify({ 
        type: 'notification', 
        message: 'Long conversation detected - older messages have been summarized to maintain performance.' 
      })}\n\n`);
    }

    let thinkOption;
    if (modelToUse === 'gpt-oss:20b') {
      //thinkOption = 'light';
      thinkOption = undefined
    } else if (modelToUse === 'deepseek-latest:r1') {
      thinkOption = true;
    } else {
      thinkOption = undefined;
    }

    const stream = await ollama.chat({
      model: modelToUse,
      messages: messageHistory,
      stream: true,
      
    });

    // Process each chunk as it arrives
    let firstChunkLogged = false;
    for await (const chunk of stream) {
      if (chunk.message?.thinking) {
        // Timing for first and last 'thinking' message
        const now = Date.now();
        if (!firstThinkingTime) {
          firstThinkingTime = now;
          console.log(`[POST /stream] First 'thinking' message after ${formatDuration(firstThinkingTime - startTime)}`);
        }
        lastThinkingTime = now;
        // Send thinking content as a separate SSE event
        res.write(`data: ${JSON.stringify({ type: 'thinking', content: chunk.message.thinking })}\n\n`);
      }
      if (chunk.message?.content) {
        if (!firstChunkLogged) {
          firstChunkTime = Date.now();
          const delta = firstChunkTime - startTime;
          console.log(`[POST /stream] First response chunk after ${formatDuration(delta)}`);
          firstChunkLogged = true;
        }
        // Send each chunk as an SSE event
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    }

    // End the stream when done
    res.write('data: [DONE]\n\n');
    res.end();

    // Log total 'thinking' time if any thinking messages were sent
    if (firstThinkingTime && lastThinkingTime) {
      const thinkingDuration = lastThinkingTime - firstThinkingTime;
      console.log(`[POST /stream] Total 'thinking' time: ${formatDuration(thinkingDuration)}`);
    }
  } catch (error) {
    console.error('Error streaming response:', error);
    
    // Only try to write error if headers haven't been sent
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }
    
    // Send error message
    res.write(`data: ${JSON.stringify({ error: 'Streaming failed', details: error.message })}\n\n`);
    res.end();
  } finally {
    const duration = Date.now() - startTime;
    if (firstChunkTime) {
      const firstChunkDelta = firstChunkTime - startTime;
      console.log(`[POST /stream] First response chunk after ${formatDuration(firstChunkDelta)}`);
    }
    if (firstThinkingTime && lastThinkingTime) {
      const thinkingDuration = lastThinkingTime - firstThinkingTime;
      console.log(`[POST /stream] Total 'thinking' time: ${formatDuration(thinkingDuration)}`);
    }
    console.log(`[POST /stream] Request took ${formatDuration(duration)}`);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});