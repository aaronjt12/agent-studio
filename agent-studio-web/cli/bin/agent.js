#!/usr/bin/env node

const path = require('path');

// Check if we're running from built dist or source
const distPath = path.join(__dirname, '../dist/index.js');
const srcPath = path.join(__dirname, '../src/index.ts');

try {
  // Try to run built version first
  require(distPath);
} catch (error) {
  // Fallback to ts-node for development
  try {
    require('ts-node/register');
    require(srcPath);
  } catch (tsError) {
    console.error('❌ Error: Could not start Agent Studio CLI');
    console.error('');
    console.error('Please run one of the following:');
    console.error('  npm run build  - Build the CLI');
    console.error('  npm install    - Install dependencies');
    console.error('');
    console.error('Original error:', error.message);
    process.exit(1);
  }
}
