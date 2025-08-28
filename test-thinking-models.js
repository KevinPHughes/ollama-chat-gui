#!/usr/bin/env node

/**
 * Test script to verify thinking model detection
 */

// Since we're testing ES modules, we need to import them properly
import { CONSTANTS } from './public/js/utils/constants.js';

console.log('Testing thinking model detection...\n');

// Test models from config
const testModels = [
  'gpt-oss:20b',    // Should support thinking
  'deepseek-r1',    // Should support thinking  
  'gemma3:12b',     // Should NOT support thinking
  'llama3.2',       // Should NOT support thinking
  'non-existent'    // Should NOT support thinking
];

testModels.forEach(modelId => {
  const supportsThinking = CONSTANTS.isThinkingModel(modelId);
  console.log(`${modelId}: ${supportsThinking ? '✅ Supports thinking' : '❌ No thinking support'}`);
});

console.log('\nTest completed! ✨');
