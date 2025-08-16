#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { initCommand } from './commands/init';
import { agentCommands } from './commands/agent';
import { projectCommands } from './commands/project';
import { flattenCommand } from './commands/flatten';
import { interactiveCommand } from './commands/interactive';
import { versionCommand } from './commands/version';

const program = new Command();

// ASCII Art Banner
console.log(chalk.cyan(figlet.textSync('BMAD-METHOD', { 
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default'
})));

console.log(chalk.yellow('🤖 AI-Driven Development Framework'));
console.log(chalk.gray('Collaborative agents for planning and development'));
console.log('');

program
  .name('bmad')
  .description('BMAD-METHOD CLI - AI-driven development with collaborative agents')
  .version('1.0.0');

// Global options
program
  .option('-v, --verbose', 'enable verbose logging')
  .option('--config <path>', 'specify config file path', '.bmad/config.yaml')
  .option('--no-color', 'disable colored output');

// Commands
program.addCommand(initCommand);
program.addCommand(agentCommands);
program.addCommand(projectCommands);
program.addCommand(flattenCommand);
program.addCommand(interactiveCommand);
program.addCommand(versionCommand);

// Quick start command
program
  .command('quickstart')
  .description('🚀 Quick start guide for new users')
  .action(async () => {
    console.log(chalk.green.bold('🚀 BMAD-METHOD Quick Start'));
    console.log('');
    console.log(chalk.yellow('1. Initialize a new project:'));
    console.log(chalk.cyan('   bmad init my-project'));
    console.log('');
    console.log(chalk.yellow('2. Create AI agents:'));
    console.log(chalk.cyan('   bmad agent create --type analyst --name "Requirements Analyst"'));
    console.log(chalk.cyan('   bmad agent create --type pm --name "Product Manager"'));
    console.log('');
    console.log(chalk.yellow('3. Start interactive mode:'));
    console.log(chalk.cyan('   bmad interactive'));
    console.log('');
    console.log(chalk.yellow('4. Generate development stories:'));
    console.log(chalk.cyan('   bmad project collaborate "Build user authentication system"'));
    console.log('');
    console.log(chalk.green('📚 For more help: bmad --help'));
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`❌ Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('💡 See \'bmad --help\' for available commands'));
  process.exit(1);
});

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}