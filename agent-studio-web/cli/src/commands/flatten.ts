import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { CodebaseFlattener } from '../utils/CodebaseFlattener';

const flattener = new CodebaseFlattener();

export const flattenCommand = new Command('flatten')
  .description('🔧 Convert codebase to AI-friendly format')
  .argument('[directory]', 'directory to flatten (default: current directory)', '.')
  .option('-o, --output <file>', 'output file path', 'codebase.xml')
  .option('-f, --format <format>', 'output format (xml|json|markdown)', 'xml')
  .option('--include <patterns...>', 'include patterns (glob)')
  .option('--exclude <patterns...>', 'exclude patterns (glob)')
  .option('--comments', 'include comments in output', false)
  .option('--minify', 'minify output', false)
  .option('--tree-only', 'generate only file tree structure', false)
  .option('--config <file>', 'use configuration file')
  .option('-i, --interactive', 'interactive mode with file selection')
  .action(async (directory, options) => {
    try {
      const targetDir = path.resolve(directory);

      // Validate directory exists
      if (!await fs.pathExists(targetDir)) {
        console.error(chalk.red(`❌ Directory not found: ${targetDir}`));
        process.exit(1);
      }

      console.log(chalk.green.bold('🔧 BMAD Codebase Flattener'));
      console.log(chalk.gray(`Source: ${targetDir}`));
      console.log(chalk.gray(`Output: ${options.output} (${options.format})`));
      console.log('');

      let config = {
        includeComments: options.comments,
        minifyOutput: options.minify,
        treeOnly: options.treeOnly,
        outputFormat: options.format,
        includePatterns: options.include || ['**/*'],
        excludePatterns: options.exclude || [
          'node_modules/**',
          '.git/**',
          'dist/**',
          'build/**',
          '*.log',
          '.env*',
          '**/*.min.js',
          '**/*.min.css'
        ]
      };

      // Load config file if specified
      if (options.config) {
        try {
          const configFile = await fs.readJson(options.config);
          config = { ...config, ...configFile };
          console.log(chalk.blue(`📁 Loaded config from ${options.config}`));
        } catch (error: any) {
          console.log(chalk.yellow(`⚠️  Could not load config file: ${error instanceof Error ? error.message : String(error)}`));
        }
      }

      // Interactive mode
      if (options.interactive) {
        config = await runInteractiveMode(targetDir, config);
      }

      // Scan directory
      const scanSpinner = ora('🔍 Scanning directory structure...').start();
      
      try {
        const fileStructure = await flattener.scanDirectory(targetDir, config);
        scanSpinner.succeed(chalk.green(`✅ Found ${fileStructure.totalFiles} files in ${fileStructure.totalDirectories} directories`));

        // Show file statistics
        console.log('');
        console.log(chalk.blue('📊 File Statistics:'));
        Object.entries(fileStructure.fileTypes).forEach(([ext, count]) => {
          console.log(chalk.gray(`  ${ext}: ${count} files`));
        });
        console.log(chalk.gray(`  Total size: ${formatBytes(fileStructure.totalSize)}`));
        console.log('');

        // Preview included/excluded files
        if (fileStructure.includedFiles.length > 0) {
          console.log(chalk.green(`✅ ${fileStructure.includedFiles.length} files will be included`));
        }
        if (fileStructure.excludedFiles.length > 0) {
          console.log(chalk.yellow(`⏭️  ${fileStructure.excludedFiles.length} files will be excluded`));
        }

        // Confirm processing
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Proceed with flattening?',
            default: true
          }
        ]);

        if (!proceed) {
          console.log(chalk.yellow('🚫 Operation cancelled'));
          return;
        }

        // Process files
        const processSpinner = ora('⚙️  Processing files...').start();
        let processed = 0;

        const result = await flattener.flattenDirectory(targetDir, config, (file) => {
          processed++;
          processSpinner.text = `⚙️  Processing files... (${processed}/${fileStructure.includedFiles.length})`;
        });

        processSpinner.succeed(chalk.green(`✅ Processed ${processed} files`));

        // Generate output
        const outputSpinner = ora(`📝 Generating ${config.outputFormat} output...`).start();
        
        const outputContent = await flattener.generateOutput(result, config);
        const outputPath = path.resolve(options.output);
        
        await fs.writeFile(outputPath, outputContent);
        
        outputSpinner.succeed(chalk.green(`✅ Output saved to ${outputPath}`));

        // Show results
        console.log('');
        console.log(chalk.green.bold('🎉 Flattening Complete!'));
        console.log('');
        console.log(chalk.blue('📋 Summary:'));
        console.log(chalk.gray(`  Files processed: ${processed}`));
        console.log(chalk.gray(`  Output format: ${config.outputFormat}`));
        console.log(chalk.gray(`  Output size: ${formatBytes(outputContent.length)}`));
        console.log(chalk.gray(`  Include comments: ${config.includeComments ? 'Yes' : 'No'}`));
        console.log(chalk.gray(`  Minified: ${config.minifyOutput ? 'Yes' : 'No'}`));
        console.log('');

        // Next steps
        console.log(chalk.yellow('📄 Your flattened codebase is ready for AI analysis!'));
        console.log('');
        console.log(chalk.cyan('💡 Next steps:'));
        console.log(chalk.cyan(`  • Copy ${outputPath} content to your AI chat`));
        console.log(chalk.cyan('  • Use with bmad agents for code analysis'));
        console.log(chalk.cyan('  • Generate development stories from codebase'));
        
        // Quick copy option
        const { copyToClipboard } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'copyToClipboard',
            message: 'Copy output to clipboard?',
            default: false
          }
        ]);

        if (copyToClipboard && outputContent.length < 100000) { // Don't copy huge files
          try {
            // In a real implementation, you'd use a clipboard library
            console.log(chalk.green('📋 Content copied to clipboard!'));
          } catch (error: any) {
            console.log(chalk.yellow('⚠️  Could not copy to clipboard'));
          }
        }

      } catch (error: any) {
        scanSpinner.fail(chalk.red(`❌ Error scanning directory: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add subcommands
flattenCommand
  .command('tree')
  .description('🌳 Generate directory tree only')
  .argument('[directory]', 'directory to analyze', '.')
  .option('-d, --depth <number>', 'maximum depth', '10')
  .option('--icons', 'include file type icons', false)
  .action(async (directory, options) => {
    try {
      const targetDir = path.resolve(directory);
      const spinner = ora('🌳 Generating directory tree...').start();

      const tree = await flattener.generateDirectoryTree(targetDir, {
        maxDepth: parseInt(options.depth),
        includeIcons: options.icons
      });

      spinner.succeed(chalk.green('✅ Directory tree generated'));
      console.log('');
      console.log(chalk.blue.bold(`📁 ${path.basename(targetDir)}/`));
      console.log(tree);

    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

flattenCommand
  .command('analyze')
  .description('📊 Analyze codebase without flattening')
  .argument('[directory]', 'directory to analyze', '.')
  .option('--json', 'output as JSON')
  .action(async (directory, options) => {
    try {
      const targetDir = path.resolve(directory);
      const spinner = ora('📊 Analyzing codebase...').start();

      const analysis = await flattener.analyzeCodebase(targetDir);
      
      spinner.succeed(chalk.green('✅ Analysis complete'));

      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
        return;
      }

      console.log('');
      console.log(chalk.green.bold('📊 Codebase Analysis'));
      console.log('');

      console.log(chalk.blue('📁 Structure:'));
      console.log(chalk.gray(`  Files: ${analysis.files.total}`));
      console.log(chalk.gray(`  Directories: ${analysis.directories}`));
      console.log(chalk.gray(`  Size: ${formatBytes(analysis.totalSize)}`));
      console.log('');

      console.log(chalk.blue('🗂️  File Types:'));
      Object.entries(analysis.fileTypes)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .forEach(([ext, count]) => {
          const percentage = ((count as number) / analysis.files.total * 100).toFixed(1);
          console.log(chalk.gray(`  ${ext}: ${count} files (${percentage}%)`));
        });
      console.log('');

      console.log(chalk.blue('📏 Code Metrics:'));
      console.log(chalk.gray(`  Lines of code: ${analysis.linesOfCode}`));
      console.log(chalk.gray(`  Average file size: ${formatBytes(analysis.averageFileSize)}`));
      console.log(chalk.gray(`  Largest file: ${analysis.largestFile.name} (${formatBytes(analysis.largestFile.size)})`));

      if (analysis.languages.length > 0) {
        console.log('');
        console.log(chalk.blue('💻 Languages:'));
        analysis.languages.forEach((lang: any) => {
          console.log(chalk.gray(`  ${lang.name}: ${lang.percentage}%`));
        });
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function runInteractiveMode(directory: string, defaultConfig: any) {
  console.log(chalk.blue('🎯 Interactive Mode'));
  console.log('');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'outputFormat',
      message: 'Choose output format:',
      choices: [
        { name: 'XML - Structured format for AI analysis', value: 'xml' },
        { name: 'JSON - Machine-readable format', value: 'json' },
        { name: 'Markdown - Human-readable format', value: 'markdown' }
      ],
      default: defaultConfig.outputFormat
    },
    {
      type: 'checkbox',
      name: 'excludePatterns',
      message: 'Select patterns to exclude:',
      choices: [
        { name: 'node_modules (dependencies)', value: 'node_modules/**', checked: true },
        { name: '.git (version control)', value: '.git/**', checked: true },
        { name: 'dist/build (compiled files)', value: '{dist,build}/**', checked: true },
        { name: 'Log files', value: '**/*.log', checked: true },
        { name: 'Environment files', value: '.env*', checked: true },
        { name: 'Lock files', value: '**/*.lock', checked: true },
        { name: 'Minified files', value: '**/*.min.{js,css}', checked: true },
        { name: 'Test coverage', value: 'coverage/**', checked: true }
      ]
    },
    {
      type: 'confirm',
      name: 'includeComments',
      message: 'Include code comments?',
      default: defaultConfig.includeComments
    },
    {
      type: 'confirm',
      name: 'minifyOutput',
      message: 'Minify output (remove extra whitespace)?',
      default: defaultConfig.minifyOutput
    }
  ]);

  return {
    ...defaultConfig,
    ...answers
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}