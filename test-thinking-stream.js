import ollama from 'ollama';

const response = await ollama.chat({
  model: 'gpt-oss:20b', // or 'gpt-oss:120b'
  messages: [{ role: 'user', content: 'Hello?' }],
  stream: true,
  options: {
    // Crucial: Set the think parameter to a valid value for gpt-oss
    think: 'medium' // Use "low", "medium", or "high"
  }
});

let fullResponseContent = '';
let fullThinkingContent = '';

for await (const part of response) {
  if (part.message.content) {
    fullResponseContent += part.message.content;
    process.stdout.write(part.message.content); // Output final content stream
  }
  if (part.message.thinking) {
    fullThinkingContent += part.message.thinking;
    // You might want to handle thinking output differently (e.g., logging to console)
    console.log('Thinking:', part.message.thinking);
  }
}

console.log('Final Answer:', fullResponseContent);
console.log('All Thinking Steps:', fullThinkingContent);

console.log("now to test deepseek-r1 with thinking");

const deepSeekResponse = await ollama.chat({
  model: 'deepseek-r1:latest',
  messages: [{ role: 'user', content: 'Hello?' }],
  stream: true,
  options: {
    // Set to true or false for DeepSeek R1
    think: true 
  }
});

fullResponseContent = '';
fullThinkingContent = '';

for await (const part of deepSeekResponse) {
  if (part.message.content) {
    fullResponseContent += part.message.content;
    process.stdout.write(part.message.content);
  }
  if (part.message.thinking) {
    fullThinkingContent += part.message.thinking;
    console.log('Thinking:', part.message.thinking); // Log the thinking steps
  }
}

console.log('Final Answer:', fullResponseContent);