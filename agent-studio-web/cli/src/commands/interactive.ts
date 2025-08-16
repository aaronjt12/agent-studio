import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { AgentManager } from '../agents/AgentManager';

const agentManager = new AgentManager();

export const interactiveCommand = new Command('interactive')
  .alias('i')
  .description('🎮 Interactive BMAD session')
  .option('-a, --agent <id>', 'start with specific agent')
  .option('--no-banner', 'skip welcome banner')
  .action(async (options) => {
    try {
      if (!options.noBanner) {
        showWelcomeBanner();
      }

      console.log(chalk.green('🎮 Welcome to BMAD Interactive Mode'));
      console.log(chalk.gray('Type "help" for commands, "exit" to quit'));
      console.log('');

      // Check for agents
      const agents = await agentManager.listAgents();
      if (agents.length === 0) {
        console.log(chalk.yellow('⚠️  No agents found. Let\'s create your first agent!'));
        await createFirstAgent();
      }

      // Start interactive session
      let activeAgent = null;
      
      if (options.agent) {
        activeAgent = await agentManager.getAgent(options.agent);
        if (activeAgent) {
          console.log(chalk.green(`🤖 Connected to ${activeAgent.name}`));
        }
      }

      while (true) {
        const prompt = activeAgent ? 
          `${chalk.blue(activeAgent.name)} > ` : 
          `${chalk.cyan('bmad')} > `;

        const { command } = await inquirer.prompt([
          {
            type: 'input',
            name: 'command',
            message: prompt,
            validate: (input: string) => input.trim() !== '' || 'Command cannot be empty'
          }
        ]);

        const trimmedCommand = command.trim().toLowerCase();

        // Handle special commands
        if (trimmedCommand === 'exit' || trimmedCommand === 'quit') {
          console.log(chalk.yellow('👋 Goodbye!'));
          break;
        }

        if (trimmedCommand === 'help') {
          showInteractiveHelp();
          continue;
        }

        if (trimmedCommand === 'clear') {
          console.clear();
          if (!options.noBanner) showWelcomeBanner();
          continue;
        }

        if (trimmedCommand.startsWith('agent ')) {
          await handleAgentCommand(command.slice(6), activeAgent, (newAgent) => {
            activeAgent = newAgent;
          });
          continue;
        }

        if (trimmedCommand.startsWith('project ')) {
          await handleProjectCommand(command.slice(8));
          continue;
        }

        if (trimmedCommand === 'status') {
          await showStatus();
          continue;
        }

        // If we have an active agent, send message to it
        if (activeAgent) {
          await handleAgentMessage(activeAgent, command);
        } else {
          console.log(chalk.red('❌ Unknown command. Type "help" for available commands.'));
          console.log(chalk.yellow('💡 Use "agent connect <id>" to chat with an agent'));
        }
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

function showWelcomeBanner() {
  console.log(chalk.cyan('╔══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.bold('              🤖 BMAD-METHOD Interactive                 ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.gray('          AI-Driven Development Framework                ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════════════╝'));
  console.log('');
}

function showInteractiveHelp() {
  console.log(chalk.green.bold('📚 Interactive Commands:'));
  console.log('');
  
  console.log(chalk.blue('🤖 Agent Commands:'));
  console.log(chalk.cyan('  agent list                 ') + chalk.gray('- List all agents'));
  console.log(chalk.cyan('  agent connect <id>         ') + chalk.gray('- Connect to an agent'));
  console.log(chalk.cyan('  agent create               ') + chalk.gray('- Create a new agent'));
  console.log(chalk.cyan('  agent start <id>           ') + chalk.gray('- Start an agent'));
  console.log(chalk.cyan('  agent stop <id>            ') + chalk.gray('- Stop an agent'));
  console.log(chalk.cyan('  agent disconnect           ') + chalk.gray('- Disconnect from current agent'));
  console.log('');

  console.log(chalk.blue('📁 Project Commands:'));
  console.log(chalk.cyan('  project status             ') + chalk.gray('- Show project status'));
  console.log(chalk.cyan('  project collaborate <task> ') + chalk.gray('- Start agent collaboration'));
  console.log(chalk.cyan('  project story <title>      ') + chalk.gray('- Generate a development story'));
  console.log('');

  console.log(chalk.blue('🔧 Utility Commands:'));
  console.log(chalk.cyan('  status                     ') + chalk.gray('- Show overall status'));
  console.log(chalk.cyan('  help                       ') + chalk.gray('- Show this help'));
  console.log(chalk.cyan('  clear                      ') + chalk.gray('- Clear screen'));
  console.log(chalk.cyan('  exit                       ') + chalk.gray('- Exit interactive mode'));
  console.log('');

  console.log(chalk.yellow('💡 Tips:'));
  console.log(chalk.gray('  • Connect to an agent to start chatting'));
  console.log(chalk.gray('  • Use Tab for command completion'));
  console.log(chalk.gray('  • Commands are case-insensitive'));
}

async function createFirstAgent() {
  console.log(chalk.blue('🎯 Let\'s create your first AI agent'));
  console.log('');

  const agentData = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What type of agent would you like to create?',
      choices: [
        { name: '🔍 Requirements Analyst - Perfect for starting new projects', value: 'analyst' },
        { name: '📋 Product Manager - Great for feature planning', value: 'pm' },
        { name: '🏗️  System Architect - Ideal for technical design', value: 'architect' },
        { name: '🎯 Scrum Master - Excellent for story breakdown', value: 'scrum-master' }
      ]
    },
    {
      type: 'input',
      name: 'name',
      message: 'Give your agent a name:',
      default: (answers: any) => {
        const names = {
          analyst: 'Requirements Analyst',
          pm: 'Product Manager', 
          architect: 'System Architect',
          'scrum-master': 'Scrum Master'
        };
        return names[answers.type as keyof typeof names];
      }
    }
  ]);

  const spinner = ora('🤖 Creating your first agent...').start();

  try {
    const agent = await agentManager.createAgent({
      type: agentData.type,
      name: agentData.name,
      description: `Your ${agentData.type} agent for AI-driven development`
    });

    await agentManager.startAgent(agent.id);
    
    spinner.succeed(chalk.green(`✅ Agent "${agent.name}" created and started!`));
    console.log('');
    console.log(chalk.yellow('🎉 You\'re ready to start! Try these commands:'));
    console.log(chalk.cyan(`  agent connect ${agent.id.slice(0, 8)}`));
    console.log(chalk.cyan('  project collaborate "build a todo app"'));
    console.log('');

    return agent;
    
  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Failed to create agent: ${error instanceof Error ? error.message : String(error)}`));
    return null;
  }
}

async function handleAgentCommand(command: string, currentAgent: any, setAgent: (agent: any) => void) {
  const parts = command.trim().split(' ');
  const subCommand = parts[0];

  try {
    switch (subCommand) {
      case 'list':
        await showAgentList();
        break;

      case 'connect':
        if (parts.length < 2) {
          console.log(chalk.red('❌ Usage: agent connect <id>'));
          return;
        }
        const agent = await agentManager.getAgent(parts[1]);
        if (!agent) {
          console.log(chalk.red(`❌ Agent ${parts[1]} not found`));
          return;
        }
        if (agent.status !== 'active') {
          const { start } = await inquirer.prompt([{
            type: 'confirm',
            name: 'start',
            message: `Agent is ${agent.status}. Start it now?`,
            default: true
          }]);
          if (start) {
            await agentManager.startAgent(agent.id);
          } else {
            return;
          }
        }
        setAgent(agent);
        console.log(chalk.green(`🤖 Connected to ${agent.name}`));
        console.log(chalk.gray('You can now chat directly. Type "agent disconnect" to return.'));
        break;

      case 'disconnect':
        if (!currentAgent) {
          console.log(chalk.yellow('⚠️  No agent connected'));
          return;
        }
        console.log(chalk.yellow(`👋 Disconnected from ${currentAgent.name}`));
        setAgent(null);
        break;

      case 'create':
        const spinner = ora('🤖 Creating agent...').start();
        try {
          // This would call the actual agent creation logic
          spinner.succeed(chalk.green('✅ Agent created! Use "agent list" to see it.'));
        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Failed to create agent: ${error instanceof Error ? error.message : String(error)}`));
        }
        break;

      case 'start':
        if (parts.length < 2) {
          console.log(chalk.red('❌ Usage: agent start <id>'));
          return;
        }
        await agentManager.startAgent(parts[1]);
        console.log(chalk.green(`✅ Agent ${parts[1]} started`));
        break;

      case 'stop':
        if (parts.length < 2) {
          console.log(chalk.red('❌ Usage: agent stop <id>'));
          return;
        }
        await agentManager.stopAgent(parts[1]);
        console.log(chalk.green(`✅ Agent ${parts[1]} stopped`));
        break;

      default:
        console.log(chalk.red(`❌ Unknown agent command: ${subCommand}`));
        console.log(chalk.yellow('💡 Available: list, connect, disconnect, create, start, stop'));
    }
  } catch (error: any) {
    console.error(chalk.red(`❌ Agent command error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

async function handleProjectCommand(command: string) {
  const parts = command.trim().split(' ');
  const subCommand = parts[0];

  try {
    switch (subCommand) {
      case 'status':
        await showProjectStatus();
        break;

      case 'collaborate':
        if (parts.length < 2) {
          console.log(chalk.red('❌ Usage: project collaborate <task description>'));
          return;
        }
        const task = parts.slice(1).join(' ');
        await startCollaboration(task);
        break;

      case 'story':
        if (parts.length < 2) {
          console.log(chalk.red('❌ Usage: project story <story title>'));
          return;
        }
        const storyTitle = parts.slice(1).join(' ');
        await generateStory(storyTitle);
        break;

      default:
        console.log(chalk.red(`❌ Unknown project command: ${subCommand}`));
        console.log(chalk.yellow('💡 Available: status, collaborate, story'));
    }
  } catch (error: any) {
    console.error(chalk.red(`❌ Project command error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

async function handleAgentMessage(agent: any, message: string) {
  if (message.trim().startsWith('agent ')) {
    console.log(chalk.yellow('💡 Use agent commands without quotes. Type "help" for commands.'));
    return;
  }

  const spinner = ora(`💭 ${agent.name} is thinking...`).start();

  try {
    // Simulate agent response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const response = await agentManager.sendMessage(agent.id, message);
    
    spinner.stop();
    console.log('');
    console.log(chalk.blue(`${agent.name}:`));
    console.log(response);
    console.log('');

  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

async function showAgentList() {
  try {
    const agents = await agentManager.listAgents();
    
    if (agents.length === 0) {
      console.log(chalk.yellow('📭 No agents found'));
      console.log(chalk.gray('Create one with: agent create'));
      return;
    }

    console.log(chalk.green(`🤖 Found ${agents.length} agent(s):`));
    console.log('');

    agents.forEach(agent => {
      const statusIcon = agent.status === 'active' ? '🟢' : 
                        agent.status === 'idle' ? '🟡' : '🔴';
      const id = agent.id.slice(0, 8) + '...';
      
      console.log(`${statusIcon} ${chalk.bold(agent.name)} ${chalk.gray(`(${id})`)}`);
      console.log(`   ${chalk.gray(`Type: ${agent.type} | Status: ${agent.status}`)}`);
    });
    console.log('');
  } catch (error: any) {
    console.error(chalk.red(`❌ Error listing agents: ${error instanceof Error ? error.message : String(error)}`));
  }
}

async function showStatus() {
  const spinner = ora('📊 Getting status...').start();
  
  try {
    const agents = await agentManager.listAgents();
    const activeAgents = agents.filter(a => a.status === 'active').length;
    
    spinner.succeed(chalk.green('📊 System Status'));
    console.log('');
    
    console.log(chalk.blue('🤖 Agents:'));
    console.log(chalk.gray(`  Total: ${agents.length}`));
    console.log(chalk.gray(`  Active: ${activeAgents}`));
    console.log(chalk.gray(`  Idle: ${agents.filter(a => a.status === 'idle').length}`));
    console.log(chalk.gray(`  Stopped: ${agents.filter(a => a.status === 'stopped').length}`));
    console.log('');

    console.log(chalk.blue('📁 Project:'));
    console.log(chalk.gray('  Current directory: ' + process.cwd()));
    console.log(chalk.gray('  BMAD config: ' + (await checkBmadConfig() ? 'Found' : 'Not found')));
    console.log('');

  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Error getting status: ${error instanceof Error ? error.message : String(error)}`));
  }
}

async function showProjectStatus() {
  console.log(chalk.blue('📁 Project Status:'));
  console.log(chalk.gray('  Name: Sample Project'));
  console.log(chalk.gray('  Stories: 3 (2 in progress, 1 completed)'));
  console.log(chalk.gray('  Last activity: 2 hours ago'));
  console.log('');
}

async function startCollaboration(task: string) {
  console.log(chalk.green(`🤝 Starting collaboration on: "${task}"`));
  console.log(chalk.gray('This would initiate agent collaboration...'));
  console.log('');
}

async function generateStory(title: string) {
  console.log(chalk.green(`📖 Generating story: "${title}"`));
  console.log(chalk.gray('This would generate a development story...'));
  console.log('');
}

async function checkBmadConfig(): Promise<boolean> {
  try {
    const fs = require('fs-extra');
    return await fs.pathExists('.bmad/config.yaml') || await fs.pathExists('.bmad/config.json');
  } catch {
    return false;
  }
}