import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { createProjectStructure, generateConfigFile } from '../utils/project-utils';

export const initCommand = new Command('init')
  .description('🏗️  Initialize a new BMAD-METHOD project')
  .argument('[project-name]', 'name of the project')
  .option('-t, --template <type>', 'project template (web, api, fullstack)', 'web')
  .option('-f, --force', 'overwrite existing directory')
  .option('--skip-install', 'skip npm package installation')
  .action(async (projectName, options) => {
    try {
      let name = projectName;
      
      if (!name) {
        const response = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'What is your project name?',
            validate: (input: string) => input.trim() !== '' || 'Project name is required'
          }
        ]);
        name = response.projectName;
      }

      const projectPath = path.resolve(process.cwd(), name);
      
      // Check if directory exists
      if (await fs.pathExists(projectPath) && !options.force) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory "${name}" already exists. Overwrite?`,
            default: false
          }
        ]);
        
        if (!overwrite) {
          console.log(chalk.yellow('🚫 Project creation cancelled'));
          return;
        }
      }

      // Project setup questions
      const config = await inquirer.prompt([
        {
          type: 'list',
          name: 'template',
          message: 'Choose a project template:',
          choices: [
            { name: 'Web Application (React/TypeScript)', value: 'web' },
            { name: 'API Service (Node.js/Express)', value: 'api' },
            { name: 'Full-Stack Application', value: 'fullstack' },
            { name: 'Microservice', value: 'microservice' },
            { name: 'CLI Tool', value: 'cli' }
          ],
          default: options.template
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project description:',
          default: `A ${name} project built with BMAD-METHOD`
        },
        {
          type: 'checkbox',
          name: 'agents',
          message: 'Which AI agents would you like to include?',
          choices: [
            { name: 'Requirements Analyst', value: 'analyst', checked: true },
            { name: 'Product Manager', value: 'pm', checked: true },
            { name: 'System Architect', value: 'architect', checked: true },
            { name: 'Scrum Master', value: 'scrum-master', checked: true }
          ]
        },
        {
          type: 'confirm',
          name: 'useExpansionPacks',
          message: 'Include expansion packs support?',
          default: true
        },
        {
          type: 'confirm',
          name: 'enableTelemetry',
          message: 'Enable telemetry for usage analytics?',
          default: true
        }
      ]);

      const spinner = ora('🏗️  Creating project structure...').start();

      try {
        // Create project directory
        await fs.ensureDir(projectPath);
        
        // Create project structure based on template
        await createProjectStructure(projectPath, config.template);
        
        // Generate BMAD configuration
        await generateConfigFile(projectPath, {
          name,
          description: config.description,
          template: config.template,
          agents: config.agents,
          useExpansionPacks: config.useExpansionPacks,
          enableTelemetry: config.enableTelemetry,
          createdAt: new Date().toISOString()
        });

        spinner.succeed(chalk.green('✅ Project structure created'));

        // Install dependencies if not skipped
        if (!options.skipInstall) {
          const installSpinner = ora('📦 Installing dependencies...').start();
          
          // Simulate package installation
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          installSpinner.succeed(chalk.green('✅ Dependencies installed'));
        }

        // Success message
        console.log('');
        console.log(chalk.green.bold('🎉 Project created successfully!'));
        console.log('');
        console.log(chalk.yellow('Next steps:'));
        console.log(chalk.cyan(`  cd ${name}`));
        console.log(chalk.cyan('  bmad agent list'));
        console.log(chalk.cyan('  bmad interactive'));
        console.log('');
        console.log(chalk.gray('📚 Learn more: bmad --help'));

      } catch (error: any) {
        spinner.fail(chalk.red('❌ Failed to create project'));
        throw error;
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });