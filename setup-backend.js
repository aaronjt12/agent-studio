#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BMAD-METHOD Backend Setup');
console.log('=====================================\n');

const backendDir = path.join(__dirname, 'bmad-method-web', 'backend');

// Check if backend directory exists
if (!fs.existsSync(backendDir)) {
  console.error('❌ Backend directory not found!');
  process.exit(1);
}

try {
  console.log('📦 Installing backend dependencies...');
  process.chdir(backendDir);
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n🗄️  Setting up database...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  
  console.log('\n✅ Backend setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. cd bmad-method-web/backend');
  console.log('2. npm run dev');
  console.log('\n🌐 Backend will be available at: http://localhost:5000');
  console.log('📊 Health check: http://localhost:5000/health');
  
  console.log('\n🔑 Optional: Add AI API keys to backend/.env:');
  console.log('- OPENAI_API_KEY for GPT-4 integration');
  console.log('- ANTHROPIC_API_KEY for Claude integration');
  console.log('(Falls back to mock AI if not provided)');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}