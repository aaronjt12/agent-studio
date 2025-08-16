import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { AgentManager } from '../agents/AgentManager';
import { Agent, AgentType } from '../types/agent';

const agentManager = new AgentManager();

export const agentCommands = new Command('agent')
  .description('🤖 Manage AI agents')
  .addCommand(createAgentCommand())
  .addCommand(listAgentsCommand())
  .addCommand(startAgentCommand())
  .addCommand(stopAgentCommand())
  .addCommand(chatCommand())
  .addCommand(configureAgentCommand())
  .addCommand(removeAgentCommand());

function createAgentCommand(): Command {
  return new Command('create')
    .description('Create a new AI agent')
    .option('-t, --type <type>', 'agent type (analyst|pm|architect|scrum-master)')
    .option('-n, --name <name>', 'agent name')
    .option('-d, --description <desc>', 'agent description')
    .option('--template <template>', 'use predefined template')
    .action(async (options) => {
      try {
        let agentConfig: Partial<Agent> = {};

        if (!options.type || !options.name) {
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'type',
              message: 'Select agent type:',
              choices: [
                { name: '🔍 Requirements Analyst - Gathers and analyzes requirements', value: 'analyst' },
                { name: '📋 Product Manager - Manages product roadmap and features', value: 'pm' },
                { name: '🏗️  System Architect - Designs system architecture', value: 'architect' },
                { name: '🎯 Scrum Master - Breaks down stories and manages workflow', value: 'scrum-master' }
              ],
              when: () => !options.type
            },
            {
              type: 'input',
              name: 'name',
              message: 'Agent name:',
              validate: (input: string) => input.trim() !== '' || 'Agent name is required',
              when: () => !options.name
            },
            {
              type: 'input',
              name: 'description',
              message: 'Agent description (optional):',
              when: () => !options.description
            },
            {
              type: 'confirm',
              name: 'useTemplate',
              message: 'Use predefined template for this agent type?',
              default: true
            }
          ]);

          agentConfig = {
            type: options.type || answers.type,
            name: options.name || answers.name,
            description: options.description || answers.description,
            // useTemplate: answers.useTemplate
          };
        } else {
          agentConfig = {
            type: options.type as AgentType,
            name: options.name,
            description: options.description
          };
        }

        const spinner = ora(`🤖 Creating ${agentConfig.type} agent "${agentConfig.name}"...`).start();

        try {
          const agent = await agentManager.createAgent(agentConfig as any);
          spinner.succeed(chalk.green(`✅ Agent "${agent.name}" created successfully`));
          
          console.log('');
          console.log(chalk.blue('📝 Agent Details:'));
          console.log(chalk.gray(`  ID: ${agent.id}`));
          console.log(chalk.gray(`  Type: ${agent.type}`));
          console.log(chalk.gray(`  Status: ${agent.status}`));
          console.log(chalk.gray(`  Description: ${agent.description || 'No description'}`));
          console.log('');
          console.log(chalk.yellow('Next steps:'));
          console.log(chalk.cyan(`  bmad agent start ${agent.id}`));
          console.log(chalk.cyan(`  bmad agent chat ${agent.id}`));

        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Failed to create agent: ${error instanceof Error ? error.message : String(error)}`));
          process.exit(1);
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function listAgentsCommand(): Command {
  return new Command('list')
    .alias('ls')
    .description('List all agents')
    .option('-s, --status <status>', 'filter by status (active|idle|stopped)')
    .option('-t, --type <type>', 'filter by type')
    .option('--json', 'output in JSON format')
    .action(async (options) => {
      try {
        const agents = await agentManager.listAgents({
          status: options.status,
          type: options.type
        });

        if (options.json) {
          console.log(JSON.stringify(agents, null, 2));
          return;
        }

        if (agents.length === 0) {
          console.log(chalk.yellow('📭 No agents found'));
          console.log(chalk.gray('Create your first agent: bmad agent create'));
          return;
        }

        console.log(chalk.green.bold(`🤖 Found ${agents.length} agent(s):`));
        console.log('');

        agents.forEach(agent => {
          const statusColor = getStatusColor(agent.status);
          const typeIcon = getTypeIcon(agent.type);
          
          console.log(`${typeIcon} ${chalk.bold(agent.name)} ${chalk.gray(`(${agent.id.slice(0, 8)}...)`)}`);
          console.log(`   Type: ${agent.type} | Status: ${statusColor(agent.status)}`);
          console.log(`   ${chalk.gray(agent.description || 'No description')}`);
          console.log(`   Last active: ${chalk.gray(agent.lastActivity || 'Never')}`);
          console.log('');
        });

        console.log(chalk.yellow('💡 Commands:'));
        console.log(chalk.cyan('  bmad agent start <id>  - Start an agent'));
        console.log(chalk.cyan('  bmad agent chat <id>   - Chat with an agent'));

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function startAgentCommand(): Command {
  return new Command('start')
    .description('Start an agent')
    .argument('<agent-id>', 'agent ID or name')
    .option('-w, --wait', 'wait for agent to be ready')
    .action(async (agentId, options) => {
      try {
        const spinner = ora(`🚀 Starting agent ${agentId}...`).start();

        try {
          await agentManager.startAgent(agentId);
          spinner.succeed(chalk.green(`✅ Agent ${agentId} started successfully`));

          if (options.wait) {
            const waitSpinner = ora('⏳ Waiting for agent to be ready...').start();
            await agentManager.waitForReady(agentId);
            waitSpinner.succeed(chalk.green('✅ Agent is ready'));
          }

          console.log('');
          console.log(chalk.yellow('💬 Start chatting:'));
          console.log(chalk.cyan(`  bmad agent chat ${agentId}`));

        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Failed to start agent: ${error instanceof Error ? error.message : String(error)}`));
          process.exit(1);
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function stopAgentCommand(): Command {
  return new Command('stop')
    .description('Stop an agent')
    .argument('<agent-id>', 'agent ID or name')
    .option('-f, --force', 'force stop without confirmation')
    .action(async (agentId, options) => {
      try {
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to stop agent ${agentId}?`,
              default: false
            }
          ]);

          if (!confirm) {
            console.log(chalk.yellow('🚫 Operation cancelled'));
            return;
          }
        }

        const spinner = ora(`🛑 Stopping agent ${agentId}...`).start();

        try {
          await agentManager.stopAgent(agentId);
          spinner.succeed(chalk.green(`✅ Agent ${agentId} stopped`));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Failed to stop agent: ${error instanceof Error ? error.message : String(error)}`));
          process.exit(1);
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function chatCommand(): Command {
  return new Command('chat')
    .description('Chat with an agent')
    .argument('<agent-id>', 'agent ID or name')
    .option('-m, --message <msg>', 'send a single message')
    .option('--context <file>', 'provide context file')
    .action(async (agentId, options) => {
      try {
        const agent = await agentManager.getAgent(agentId);
        if (!agent) {
          console.error(chalk.red(`❌ Agent ${agentId} not found`));
          process.exit(1);
        }

        if (agent.status !== 'active') {
          const { start } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'start',
              message: `Agent is ${agent.status}. Start it now?`,
              default: true
            }
          ]);

          if (start) {
            await agentManager.startAgent(agentId);
            console.log(chalk.green(`✅ Agent ${agent.name} started`));
          } else {
            return;
          }
        }

        if (options.message) {
          // Single message mode
          const spinner = ora(`💭 Thinking...`).start();
          try {
            const response = await agentManager.sendMessage(agentId, options.message, {
              contextFile: options.context
            });
            spinner.stop();
            console.log('');
            console.log(chalk.blue(`${agent.name}:`));
            console.log(response);
          } catch (error: any) {
            spinner.fail(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
          }
          return;
        }

        // Interactive chat mode
        console.log(chalk.green.bold(`💬 Chatting with ${agent.name}`));
        console.log(chalk.gray('Type "exit" to quit, "help" for commands'));
        console.log('');

        while (true) {
          const { message } = await inquirer.prompt([
            {
              type: 'input',
              name: 'message',
              message: 'You:',
              validate: (input: string) => input.trim() !== '' || 'Message cannot be empty'
            }
          ]);

          if (message.toLowerCase() === 'exit') {
            console.log(chalk.yellow('👋 Chat ended'));
            break;
          }

          if (message.toLowerCase() === 'help') {
            console.log(chalk.blue('🔧 Available commands:'));
            console.log('  exit - End chat session');
            console.log('  help - Show this help');
            console.log('  clear - Clear chat history');
            console.log('  status - Show agent status');
            continue;
          }

          const spinner = ora(`💭 ${agent.name} is thinking...`).start();
          try {
            const response = await agentManager.sendMessage(agentId, message);
            spinner.stop();
            console.log('');
            console.log(chalk.blue(`${agent.name}:`));
            console.log(response);
            console.log('');
          } catch (error: any) {
            spinner.fail(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
          }
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function configureAgentCommand(): Command {
  return new Command('configure')
    .alias('config')
    .description('Configure agent settings')
    .argument('<agent-id>', 'agent ID or name')
    .option('--prompt <file>', 'set custom prompt from file')
    .option('--temperature <value>', 'set temperature (0-1)')
    .option('--max-tokens <value>', 'set max tokens')
    .action(async (agentId, options) => {
      try {
        const agent = await agentManager.getAgent(agentId);
        if (!agent) {
          console.error(chalk.red(`❌ Agent ${agentId} not found`));
          process.exit(1);
        }

        const updates = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Agent name:',
            default: agent.name
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:',
            default: agent.description
          },
          {
            type: 'number',
            name: 'temperature',
            message: 'Temperature (0-1):',
            default: agent.configuration?.temperature || 0.7,
            validate: (value: number) => (value >= 0 && value <= 1) || 'Temperature must be between 0 and 1'
          },
          {
            type: 'number',
            name: 'maxTokens',
            message: 'Max tokens:',
            default: agent.configuration?.maxTokens || 1000
          }
        ]);

        const spinner = ora('⚙️  Updating agent configuration...').start();
        
        try {
          await agentManager.updateAgent(agentId, {
            name: updates.name,
            description: updates.description,
            configuration: {
              ...agent.configuration,
              temperature: updates.temperature,
              maxTokens: updates.maxTokens
            }
          });
          
          spinner.succeed(chalk.green('✅ Agent configuration updated'));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`));
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function removeAgentCommand(): Command {
  return new Command('remove')
    .alias('rm')
    .description('Remove an agent')
    .argument('<agent-id>', 'agent ID or name')
    .option('-f, --force', 'force remove without confirmation')
    .action(async (agentId, options) => {
      try {
        const agent = await agentManager.getAgent(agentId);
        if (!agent) {
          console.error(chalk.red(`❌ Agent ${agentId} not found`));
          process.exit(1);
        }

        if (!options.force) {
          console.log(chalk.yellow(`⚠️  This will permanently delete agent "${agent.name}"`));
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure?',
              default: false
            }
          ]);

          if (!confirm) {
            console.log(chalk.yellow('🚫 Operation cancelled'));
            return;
          }
        }

        const spinner = ora(`🗑️  Removing agent ${agent.name}...`).start();
        
        try {
          await agentManager.removeAgent(agentId);
          spinner.succeed(chalk.green('✅ Agent removed successfully'));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Failed to remove agent: ${error instanceof Error ? error.message : String(error)}`));
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

// Helper functions
function getStatusColor(status: string) {
  switch (status) {
    case 'active': return chalk.green;
    case 'idle': return chalk.yellow;
    case 'stopped': return chalk.red;
    default: return chalk.gray;
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'analyst': return '🔍';
    case 'pm': return '📋';
    case 'architect': return '🏗️';
    case 'scrum-master': return '🎯';
    default: return '🤖';
  }
}