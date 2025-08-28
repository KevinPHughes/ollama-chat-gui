#!/usr/bin/env node

/**
 * Test script to verify model selector population
 */

import { CONFIG } from './public/js/config/config.js';

console.log('Testing model selector population from config...\n');

console.log('Models in config:');
CONFIG.MODELS.supportedModels.forEach(model => {
  const thinkingIcon = model.supportsThinking ? ' 🧠' : '';
  console.log(`- ${model.name}${thinkingIcon} (${model.id})`);
});

console.log(`\nDefault model: ${CONFIG.MODELS.default}`);

// Simulate HTML option creation
console.log('\nGenerated HTML options:');
CONFIG.MODELS.supportedModels.forEach(model => {
  const thinkingIcon = model.supportsThinking ? ' 🧠' : '';
  console.log(`<option value="${model.id}">${model.name}${thinkingIcon}</option>`);
});

console.log('\nTest completed! ✨');
