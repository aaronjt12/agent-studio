import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export const versionCommand = new Command('version')
  .alias('-v')
  .description('📋 Show version information')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageInfo = await fs.readJson(packagePath);

      const versionInfo = {
        version: packageInfo.version,
        name: packageInfo.name,
        description: packageInfo.description,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        timestamp: new Date().toISOString()
      };

      if (options.json) {
        console.log(JSON.stringify(versionInfo, null, 2));
        return;
      }

      console.log(chalk.cyan('╔══════════════════════════════════════════════════════════╗'));
      console.log(chalk.cyan('║') + chalk.bold('                  🤖 BMAD-METHOD                        ') + chalk.cyan('║'));
      console.log(chalk.cyan('╚══════════════════════════════════════════════════════════╝'));
      console.log('');
      
      console.log(chalk.blue('📦 Package Information:'));
      console.log(chalk.gray(`  Name: ${packageInfo.name}`));
      console.log(chalk.gray(`  Version: ${packageInfo.version}`));
      console.log(chalk.gray(`  Description: ${packageInfo.description}`));
      console.log('');

      console.log(chalk.blue('🔧 System Information:'));
      console.log(chalk.gray(`  Node.js: ${process.version}`));
      console.log(chalk.gray(`  Platform: ${process.platform}`));
      console.log(chalk.gray(`  Architecture: ${process.arch}`));
      console.log('');

      console.log(chalk.blue('📚 Resources:'));
      console.log(chalk.cyan('  GitHub: https://github.com/bmad-code-org/BMAD-METHOD'));
      console.log(chalk.cyan('  Documentation: https://bmad-method.org/docs'));
      console.log(chalk.cyan('  Discord: https://discord.gg/bmad-method'));
      console.log('');

      console.log(chalk.yellow('💡 Quick Commands:'));
      console.log(chalk.cyan('  bmad init my-project    - Create new project'));
      console.log(chalk.cyan('  bmad agent create       - Create AI agent'));
      console.log(chalk.cyan('  bmad interactive        - Start interactive mode'));
      console.log(chalk.cyan('  bmad quickstart         - Show quick start guide'));

    } catch (error: any) {
      console.error(chalk.red('❌ Error reading version information:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });