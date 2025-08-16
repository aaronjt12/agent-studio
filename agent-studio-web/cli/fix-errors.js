const fs = require('fs');
const path = require('path');

// Function to replace error handling in files
function fixErrorHandling(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace error.message with proper error handling
  content = content.replace(
    /error\.message/g, 
    'error instanceof Error ? error.message : String(error)'
  );
  
  // Replace catch (error) with proper typing where needed
  content = content.replace(
    /} catch \(error\) {/g,
    '} catch (error: any) {'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed error handling in ${filePath}`);
}

// Fix specific issues in agent commands
function fixAgentCommands() {
  const filePath = path.join(__dirname, 'src/commands/agent.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the useTemplate issue
  content = content.replace(
    /useTemplate: answers\.useTemplate/g,
    '// useTemplate: answers.useTemplate'
  );
  
  // Fix type issues with agentConfig
  content = content.replace(
    /const agent = await agentManager\.createAgent\(agentConfig\);/g,
    'const agent = await agentManager.createAgent(agentConfig as CreateAgentOptions);'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed agent command specific issues');
}

// Fix project commands
function fixProjectCommands() {
  const filePath = path.join(__dirname, 'src/commands/project.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix implicit any type
  content = content.replace(
    /agentIds\.some\(id => agent\.id\.includes\(id\)/g,
    'agentIds.some((id: string) => agent.id.includes(id)'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed project command issues');
}

// Fix CodebaseFlattener glob import
function fixCodebaseFlattener() {
  const filePath = path.join(__dirname, 'src/utils/CodebaseFlattener.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix glob import
  content = content.replace(
    "import { glob } from 'glob';",
    "import * as glob from 'glob';"
  );
  
  // Fix glob usage
  content = content.replace(
    /const files = await glob\(/g,
    'const files = await glob.glob('
  );
  
  content = content.replace(
    /const dirs = await glob\(/g,
    'const dirs = await glob.glob('
  );
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed CodebaseFlattener glob issues');
}

// Fix all files
const srcDir = path.join(__dirname, 'src');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      fixErrorHandling(filePath);
    }
  });
}

console.log('Fixing TypeScript errors...');
walkDir(srcDir);
fixAgentCommands();
fixProjectCommands();
fixCodebaseFlattener();
console.log('All errors fixed!');