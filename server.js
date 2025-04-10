import express from 'express';
import ollama from 'ollama';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001; // Or any port you prefer

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.static('public', { index: false }));

// Now this will work
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'streaming.html'));
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await ollama.chat({
      model: 'gemma3',
      messages: [{ role: 'user', content: message }],
    });
    console.log(response.message.content);

    res.json({ message: response });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/stream', async (req, res) => {
  const { message, messages, model } = req.body;

  if (!message && !messages) {
    return res.status(400).json({ error: 'Message or messages are required' });
  }

  // Use provided message history or create a simple one with the current message
  const messageHistory = messages || [{ role: 'user', content: message }];

  // Use specified model or default to gemma3
  const modelToUse = model || 'gemma3';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await ollama.chat({
      model: modelToUse, // Use the model specified by the client
      messages: messageHistory,
      stream: true
    });

    // Process each chunk as it arrives
    for await (const chunk of stream) {
      if (chunk.message?.content) {
        // Send each chunk as an SSE event
        console.log("chunk: ", chunk.message.content)
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    }

    // End the stream when done
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error streaming response:', error);
    res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});