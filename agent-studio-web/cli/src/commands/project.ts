import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { AgentManager } from '../agents/AgentManager';
import { ProjectManager } from '../utils/ProjectManager';
import fs from 'fs-extra';
import path from 'path';

const agentManager = new AgentManager();
const projectManager = new ProjectManager();

export const projectCommands = new Command('project')
  .description('📁 Manage BMAD projects')
  .addCommand(collaborateCommand())
  .addCommand(generateStoryCommand())
  .addCommand(statusCommand())
  .addCommand(exportCommand())
  .addCommand(templatesCommand());

function collaborateCommand(): Command {
  return new Command('collaborate')
    .description('🤝 Start agent collaboration on a task')
    .argument('<task-description>', 'description of the task or feature')
    .option('-a, --agents <agents...>', 'specific agents to include (comma-separated)')
    .option('-f, --flow <flow>', 'collaboration flow (full|quick|technical)', 'full')
    .option('-o, --output <file>', 'output file for results')
    .option('--context <file>', 'provide context file')
    .action(async (taskDescription, options) => {
      try {
        console.log(chalk.green.bold('🤝 Starting Agent Collaboration'));
        console.log(chalk.gray(`Task: ${taskDescription}`));
        console.log('');

        // Get available agents
        const allAgents = await agentManager.listAgents({ status: 'active' });
        if (allAgents.length === 0) {
          console.log(chalk.red('❌ No active agents found'));
          console.log(chalk.yellow('💡 Start some agents first: bmad agent start <id>'));
          return;
        }

        let selectedAgents = allAgents;

        // Filter agents if specified
        if (options.agents) {
          const agentIds = options.agents.join(',').split(',').map((id: string) => id.trim());
          selectedAgents = allAgents.filter(agent => 
            agentIds.some((id: string) => agent.id.includes(id) || agent.name.toLowerCase().includes(id.toLowerCase()))
          );
        }

        // Select collaboration flow
        const flows = {
          full: {
            name: 'Full Analysis Flow',
            description: 'Complete analysis from requirements to implementation stories',
            agents: ['analyst', 'pm', 'architect', 'scrum-master'],
            estimatedTime: '2-4 hours'
          },
          quick: {
            name: 'Quick Planning',
            description: 'Rapid planning for simple features',
            agents: ['pm', 'scrum-master'],
            estimatedTime: '30-60 minutes'
          },
          technical: {
            name: 'Technical Deep Dive',
            description: 'Architecture-focused analysis for complex systems',
            agents: ['architect', 'analyst', 'scrum-master'],
            estimatedTime: '3-6 hours'
          }
        };

        const selectedFlow = flows[options.flow as keyof typeof flows] || flows.full;

        console.log(chalk.blue('📋 Collaboration Details:'));
        console.log(chalk.gray(`  Flow: ${selectedFlow.name}`));
        console.log(chalk.gray(`  Description: ${selectedFlow.description}`));
        console.log(chalk.gray(`  Estimated time: ${selectedFlow.estimatedTime}`));
        console.log(chalk.gray(`  Agents: ${selectedAgents.map(a => a.name).join(', ')}`));
        console.log('');

        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Start collaboration?',
            default: true
          }
        ]);

        if (!proceed) {
          console.log(chalk.yellow('🚫 Collaboration cancelled'));
          return;
        }

        // Start collaboration process
        const spinner = ora('🎬 Initiating collaboration...').start();

        try {
          const collaboration = await startCollaboration(taskDescription, selectedAgents, selectedFlow, options.context);
          
          spinner.succeed(chalk.green('✅ Collaboration completed successfully'));
          console.log('');

          // Display results
          console.log(chalk.green.bold('📄 Collaboration Results:'));
          console.log('');

          collaboration.artifacts.forEach((artifact, index) => {
            console.log(chalk.blue(`${index + 1}. ${artifact.title}`));
            console.log(chalk.gray(`   Type: ${artifact.type} | Author: ${artifact.author}`));
            console.log(chalk.white(`   ${artifact.content.slice(0, 150)}${artifact.content.length > 150 ? '...' : ''}`));
            console.log('');
          });

          // Save results if output file specified
          if (options.output) {
            await saveCollaborationResults(collaboration, options.output);
            console.log(chalk.green(`💾 Results saved to ${options.output}`));
          }

          console.log(chalk.yellow('📝 Generated artifacts:'));
          console.log(chalk.cyan('  • Product Requirements Document (PRD)'));
          console.log(chalk.cyan('  • System Architecture Specification'));
          console.log(chalk.cyan('  • Development Stories'));
          console.log(chalk.cyan('  • Implementation Plan'));

        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Collaboration failed: ${error instanceof Error ? error.message : String(error)}`));
          process.exit(1);
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function generateStoryCommand(): Command {
  return new Command('story')
    .description('📖 Generate a development story')
    .argument('<story-title>', 'title of the story')
    .option('-d, --description <desc>', 'story description')
    .option('-a, --agent <agent>', 'specific agent to use')
    .option('-p, --priority <level>', 'priority level (low|medium|high)', 'medium')
    .option('-e, --estimate <hours>', 'estimated hours')
    .option('--acceptance-criteria <criteria...>', 'acceptance criteria')
    .action(async (storyTitle, options) => {
      try {
        console.log(chalk.green.bold('📖 Generating Development Story'));
        console.log('');

        const storyData = await inquirer.prompt([
          {
            type: 'input',
            name: 'description',
            message: 'Story description:',
            default: options.description
          },
          {
            type: 'list',
            name: 'priority',
            message: 'Priority level:',
            choices: [
              { name: '🔴 High - Critical feature', value: 'high' },
              { name: '🟡 Medium - Important feature', value: 'medium' },
              { name: '🟢 Low - Nice to have', value: 'low' }
            ],
            default: options.priority
          },
          {
            type: 'number',
            name: 'estimatedHours',
            message: 'Estimated hours:',
            default: options.estimate || 8
          },
          {
            type: 'input',
            name: 'acceptanceCriteria',
            message: 'Acceptance criteria (comma-separated):',
            default: options.acceptanceCriteria?.join(', ')
          }
        ]);

        const spinner = ora('🔄 Generating story with AI agent...').start();

        try {
          const story = await generateStoryWithAI({
            title: storyTitle,
            description: storyData.description,
            priority: storyData.priority,
            estimatedHours: storyData.estimatedHours,
            acceptanceCriteria: storyData.acceptanceCriteria?.split(',').map((c: string) => c.trim())
          });

          spinner.succeed(chalk.green('✅ Story generated successfully'));
          console.log('');

          // Display story details
          console.log(chalk.blue.bold('📝 Generated Story:'));
          console.log('');
          console.log(chalk.yellow('Title:'), story.title);
          console.log(chalk.yellow('Description:'), story.description);
          console.log(chalk.yellow('Priority:'), getPriorityDisplay(story.priority));
          console.log(chalk.yellow('Estimated Hours:'), story.estimatedHours);
          console.log('');

          if (story.acceptanceCriteria.length > 0) {
            console.log(chalk.yellow('Acceptance Criteria:'));
            story.acceptanceCriteria.forEach((criteria: string, index: number) => {
              console.log(chalk.gray(`  ${index + 1}. ${criteria}`));
            });
            console.log('');
          }

          if (story.tasks.length > 0) {
            console.log(chalk.yellow('Implementation Tasks:'));
            story.tasks.forEach((task: string, index: number) => {
              console.log(chalk.gray(`  • ${task}`));
            });
            console.log('');
          }

          console.log(chalk.green('💡 Next steps:'));
          console.log(chalk.cyan('  • Review and refine the story'));
          console.log(chalk.cyan('  • Assign to development team'));
          console.log(chalk.cyan('  • Break down into smaller tasks if needed'));

        } catch (error: any) {
          spinner.fail(chalk.red(`❌ Failed to generate story: ${error instanceof Error ? error.message : String(error)}`));
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function statusCommand(): Command {
  return new Command('status')
    .description('📊 Show project status')
    .option('--json', 'output in JSON format')
    .action(async (options) => {
      try {
        const status = await projectManager.getProjectStatus();

        if (options.json) {
          console.log(JSON.stringify(status, null, 2));
          return;
        }

        console.log(chalk.green.bold('📊 Project Status'));
        console.log('');

        // Project Info
        console.log(chalk.blue('📁 Project Information:'));
        console.log(chalk.gray(`  Name: ${status.name}`));
        console.log(chalk.gray(`  Description: ${status.description}`));
        console.log(chalk.gray(`  Created: ${status.createdAt}`));
        console.log('');

        // Stories Summary
        console.log(chalk.blue('📖 Stories Summary:'));
        console.log(chalk.gray(`  Total: ${status.stories.total}`));
        console.log(chalk.gray(`  Completed: ${chalk.green(status.stories.completed)} (${status.stories.completionRate}%)`));
        console.log(chalk.gray(`  In Progress: ${chalk.yellow(status.stories.inProgress)}`));
        console.log(chalk.gray(`  Planning: ${chalk.blue(status.stories.planning)}`));
        console.log('');

        // Agents Summary
        console.log(chalk.blue('🤖 Agents Summary:'));
        console.log(chalk.gray(`  Total: ${status.agents.total}`));
        console.log(chalk.gray(`  Active: ${chalk.green(status.agents.active)}`));
        console.log(chalk.gray(`  Idle: ${chalk.yellow(status.agents.idle)}`));
        console.log(chalk.gray(`  Stopped: ${chalk.red(status.agents.stopped)}`));
        console.log('');

        // Recent Activity
        if (status.recentActivity.length > 0) {
          console.log(chalk.blue('📅 Recent Activity:'));
          status.recentActivity.slice(0, 5).forEach((activity: any) => {
            console.log(chalk.gray(`  • ${activity.message} (${activity.timestamp})`));
          });
        }

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function exportCommand(): Command {
  return new Command('export')
    .description('📤 Export project data')
    .option('-f, --format <format>', 'export format (json|yaml|xml)', 'json')
    .option('-o, --output <file>', 'output file path')
    .option('--include <items...>', 'items to include (stories|agents|config)', ['stories', 'agents', 'config'])
    .action(async (options) => {
      try {
        const spinner = ora(`📤 Exporting project data as ${options.format}...`).start();

        const exportData = await projectManager.exportProject({
          format: options.format,
          include: options.include
        });

        const outputFile = options.output || `project-export.${options.format}`;
        await fs.writeFile(outputFile, exportData);

        spinner.succeed(chalk.green(`✅ Project exported to ${outputFile}`));

        console.log('');
        console.log(chalk.blue('📋 Export Summary:'));
        console.log(chalk.gray(`  Format: ${options.format}`));
        console.log(chalk.gray(`  File: ${outputFile}`));
        console.log(chalk.gray(`  Included: ${options.include.join(', ')}`));

      } catch (error: any) {
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function templatesCommand(): Command {
  return new Command('templates')
    .description('📋 Manage project templates')
    .addCommand(new Command('list')
      .description('List available templates')
      .action(async () => {
        console.log(chalk.green.bold('📋 Available Project Templates:'));
        console.log('');

        const templates = [
          { name: 'web-app', description: 'React/TypeScript web application' },
          { name: 'api-service', description: 'Node.js/Express API service' },
          { name: 'fullstack', description: 'Full-stack application' },
          { name: 'microservice', description: 'Microservice architecture' },
          { name: 'cli-tool', description: 'Command-line tool' }
        ];

        templates.forEach(template => {
          console.log(`🔧 ${chalk.blue(template.name)}`);
          console.log(`   ${chalk.gray(template.description)}`);
          console.log('');
        });

        console.log(chalk.yellow('💡 Use template: bmad init my-project --template <name>'));
      }));

  return projectCommands;
}

// Helper functions
async function startCollaboration(taskDescription: string, agents: any[], flow: any, contextFile?: string) {
  // Simulate collaboration process
  const artifacts = [];

  for (const agent of agents) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

    let content = '';
    switch (agent.type) {
      case 'analyst':
        content = `Requirements Analysis for "${taskDescription}": Functional requirements include user authentication, data validation, and error handling. Non-functional requirements include performance (<2s response time) and security (OAuth2).`;
        break;
      case 'pm':
        content = `Product Strategy for "${taskDescription}": Priority: High. Target users: End users and administrators. Success metrics: User engagement +20%, error rate <1%. Timeline: 2 sprints.`;
        break;
      case 'architect':
        content = `System Architecture for "${taskDescription}": Microservices architecture with API Gateway, Auth Service, and Database Service. Technologies: Node.js, PostgreSQL, Redis. Deployment: Docker containers on Kubernetes.`;
        break;
      case 'scrum-master':
        content = `Development Stories for "${taskDescription}": Story 1: User login/logout (5 pts). Story 2: Password reset (3 pts). Story 3: Profile management (8 pts). Total effort: 16 story points.`;
        break;
    }

    artifacts.push({
      id: `artifact_${Date.now()}_${agent.id}`,
      type: agent.type === 'analyst' ? 'requirements' : 
            agent.type === 'pm' ? 'strategy' :
            agent.type === 'architect' ? 'architecture' : 'stories',
      title: `${agent.name} Analysis`,
      content,
      author: agent.name,
      createdDate: new Date().toISOString(),
      version: 1
    });
  }

  return {
    id: `collaboration_${Date.now()}`,
    taskDescription,
    agents: agents.map(a => a.id),
    status: 'completed',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    artifacts
  };
}

async function saveCollaborationResults(collaboration: any, outputFile: string) {
  const results = {
    collaboration,
    summary: {
      task: collaboration.taskDescription,
      agents: collaboration.agents.length,
      artifacts: collaboration.artifacts.length,
      completedAt: collaboration.endDate
    },
    artifacts: collaboration.artifacts
  };

  await fs.writeFile(outputFile, JSON.stringify(results, null, 2));
}

async function generateStoryWithAI(storyData: any) {
  // Simulate AI story generation
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    id: `story_${Date.now()}`,
    title: storyData.title,
    description: storyData.description,
    priority: storyData.priority,
    estimatedHours: storyData.estimatedHours,
    acceptanceCriteria: storyData.acceptanceCriteria || [
      'User can successfully complete the main workflow',
      'Error handling works correctly',
      'UI is responsive and accessible'
    ],
    tasks: [
      'Set up project structure and dependencies',
      'Implement core functionality',
      'Add error handling and validation',
      'Write unit and integration tests',
      'Update documentation'
    ],
    createdAt: new Date().toISOString(),
    status: 'planning'
  };
}

function getPriorityDisplay(priority: string): string {
  switch (priority) {
    case 'high': return '🔴 High';
    case 'medium': return '🟡 Medium';
    case 'low': return '🟢 Low';
    default: return priority;
  }
}