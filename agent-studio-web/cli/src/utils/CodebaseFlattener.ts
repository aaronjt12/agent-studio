import fs from 'fs-extra';
import path from 'path';
import { getFileExtension, isCodeFile, formatBytes } from './helpers';

export interface FileStructure {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  includedFiles: string[];
  excludedFiles: string[];
}

export interface FlattenerConfig {
  includeComments: boolean;
  minifyOutput: boolean;
  treeOnly: boolean;
  outputFormat: 'xml' | 'json' | 'markdown';
  includePatterns: string[];
  excludePatterns: string[];
}

export interface ProcessedFile {
  path: string;
  relativePath: string;
  content: string;
  size: number;
  language: string;
  lineCount: number;
  lastModified: Date;
}

export interface FlattenResult {
  metadata: {
    processedAt: string;
    totalFiles: number;
    totalSize: number;
    config: FlattenerConfig;
  };
  files: ProcessedFile[];
  directoryTree: string;
}

export interface CodebaseAnalysis {
  files: {
    total: number;
    byLanguage: Record<string, number>;
  };
  directories: number;
  totalSize: number;
  averageFileSize: number;
  largestFile: {
    name: string;
    size: number;
  };
  fileTypes: Record<string, number>;
  languages: Array<{
    name: string;
    files: number;
    percentage: number;
  }>;
  linesOfCode: number;
}

export class CodebaseFlattener {
  async scanDirectory(directory: string, config: FlattenerConfig): Promise<FileStructure> {
    const allFiles: string[] = [];
    const fileTypes: Record<string, number> = {};
    let totalSize = 0;
    let totalDirectories = 0;

    // Recursively walk directory
    const walkDir = async (dir: string, depth: number = 0): Promise<void> => {
      if (depth > 10) return; // Prevent infinite recursion

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(directory, fullPath);
          
          // Check if path should be excluded
          if (this.shouldExcludeFile(relativePath, config.excludePatterns)) {
            continue;
          }
          
          if (entry.isDirectory()) {
            totalDirectories++;
            await walkDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            allFiles.push(fullPath);
            
            try {
              const stats = await fs.stat(fullPath);
              const extension = getFileExtension(entry.name) || 'no-extension';
              fileTypes[extension] = (fileTypes[extension] || 0) + 1;
              totalSize += stats.size;
            } catch (error: any) {
              // Skip files that can't be accessed
            }
          }
        }
      } catch (error: any) {
        // Skip directories that can't be read
      }
    };

    await walkDir(directory);

    return {
      totalFiles: allFiles.length,
      totalDirectories,
      totalSize,
      fileTypes,
      includedFiles: allFiles,
      excludedFiles: []
    };
  }

  async flattenDirectory(
    directory: string, 
    config: FlattenerConfig, 
    onProgress?: (file: string) => void
  ): Promise<FlattenResult> {
    const structure = await this.scanDirectory(directory, config);
    const processedFiles: ProcessedFile[] = [];

    for (const filePath of structure.includedFiles) {
      try {
        const stats = await fs.stat(filePath);
        const relativePath = path.relative(directory, filePath);
        
        let content = '';
        if (!config.treeOnly && isCodeFile(path.basename(filePath))) {
          content = await fs.readFile(filePath, 'utf8');
          
          // Remove comments if requested
          if (!config.includeComments) {
            content = this.removeComments(content, getFileExtension(path.basename(filePath)));
          }
          
          // Minify if requested
          if (config.minifyOutput) {
            content = this.minifyContent(content);
          }
        }

        const processedFile: ProcessedFile = {
          path: filePath,
          relativePath,
          content,
          size: stats.size,
          language: this.getLanguageFromExtension(getFileExtension(path.basename(filePath))),
          lineCount: content.split('\n').length,
          lastModified: stats.mtime
        };

        processedFiles.push(processedFile);
        
        if (onProgress) {
          onProgress(filePath);
        }
      } catch (error: any) {
        console.warn(`Warning: Could not process file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Generate directory tree
    const directoryTree = await this.generateDirectoryTree(directory, {
      maxDepth: 10,
      includeIcons: false
    });

    return {
      metadata: {
        processedAt: new Date().toISOString(),
        totalFiles: processedFiles.length,
        totalSize: processedFiles.reduce((sum, f) => sum + f.size, 0),
        config
      },
      files: processedFiles,
      directoryTree
    };
  }

  async generateOutput(result: FlattenResult, config: FlattenerConfig): Promise<string> {
    switch (config.outputFormat) {
      case 'xml':
        return this.generateXmlOutput(result);
      case 'json':
        return this.generateJsonOutput(result);
      case 'markdown':
        return this.generateMarkdownOutput(result);
      default:
        return this.generateXmlOutput(result);
    }
  }

  async generateDirectoryTree(directory: string, options: { maxDepth: number; includeIcons: boolean }): Promise<string> {
    const tree: string[] = [];
    
    const buildTree = async (dir: string, depth: number, prefix: string = ''): Promise<void> => {
      if (depth > options.maxDepth) return;
      
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const sortedEntries = entries.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

        for (let i = 0; i < sortedEntries.length; i++) {
          const entry = sortedEntries[i];
          const isLast = i === sortedEntries.length - 1;
          const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          
          let icon = '';
          if (options.includeIcons) {
            icon = entry.isDirectory() ? '📁 ' : this.getFileIcon(entry.name);
          }
          
          tree.push(currentPrefix + icon + entry.name);
          
          if (entry.isDirectory()) {
            await buildTree(path.join(dir, entry.name), depth + 1, nextPrefix);
          }
        }
      } catch (error: any) {
        // Skip directories that can't be read
      }
    };
    
    await buildTree(directory, 0);
    return tree.join('\n');
  }

  async analyzeCodebase(directory: string): Promise<CodebaseAnalysis> {
    const allFiles: string[] = [];
    const fileTypes: Record<string, number> = {};
    const languageFiles: Record<string, number> = {};
    let totalSize = 0;
    let totalDirectories = 0;
    let linesOfCode = 0;
    let largestFile = { name: '', size: 0 };

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(directory, fullPath);
          
          // Skip common exclude patterns
          if (this.shouldExcludeFile(relativePath, [
            'node_modules/**', '.git/**', 'dist/**', 'build/**'
          ])) {
            continue;
          }
          
          if (entry.isDirectory()) {
            totalDirectories++;
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            allFiles.push(fullPath);
            
            try {
              const stats = await fs.stat(fullPath);
              const extension = getFileExtension(entry.name) || 'no-extension';
              const language = this.getLanguageFromExtension(extension);
              
              fileTypes[extension] = (fileTypes[extension] || 0) + 1;
              languageFiles[language] = (languageFiles[language] || 0) + 1;
              totalSize += stats.size;

              if (stats.size > largestFile.size) {
                largestFile = { name: entry.name, size: stats.size };
              }

              // Count lines of code for text files
              if (isCodeFile(entry.name) && stats.size < 1024 * 1024) { // Skip files > 1MB
                try {
                  const content = await fs.readFile(fullPath, 'utf8');
                  linesOfCode += content.split('\n').length;
                } catch {
                  // Skip binary or unreadable files
                }
              }
            } catch (error: any) {
              // Skip files that can't be accessed
            }
          }
        }
      } catch (error: any) {
        // Skip directories that can't be read
      }
    };

    await walkDir(directory);

    // Calculate language percentages
    const totalLanguageFiles = Object.values(languageFiles).reduce((sum, count) => sum + count, 0);
    const languages = Object.entries(languageFiles)
      .map(([name, files]) => ({
        name,
        files,
        percentage: Math.round((files / totalLanguageFiles) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      files: {
        total: allFiles.length,
        byLanguage: languageFiles
      },
      directories: totalDirectories,
      totalSize,
      averageFileSize: allFiles.length > 0 ? totalSize / allFiles.length : 0,
      largestFile,
      fileTypes,
      languages,
      linesOfCode
    };
  }

  private shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
    
    return excludePatterns.some(pattern => {
      const normalizedPattern = pattern.replace(/\\/g, '/').toLowerCase();
      
      // Handle simple patterns
      if (pattern.includes('**')) {
        const regexPattern = normalizedPattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*');
        return new RegExp(regexPattern).test(normalizedPath);
      }
      
      // Handle direct path matches
      return normalizedPath.includes(normalizedPattern);
    });
  }

  private removeComments(content: string, extension: string): string {
    // Simple comment removal
    const commentPatterns: Record<string, RegExp[]> = {
      js: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
      ts: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
      py: [/#.*$/gm],
      css: [/\/\*[\s\S]*?\*\//g],
      html: [/<!--[\s\S]*?-->/g]
    };

    const patterns = commentPatterns[extension] || [];
    let result = content;
    
    for (const pattern of patterns) {
      result = result.replace(pattern, '');
    }
    
    return result;
  }

  private minifyContent(content: string): string {
    return content
      .replace(/\s+$/gm, '') // Remove trailing whitespace
      .replace(/^\s+/gm, '') // Remove leading whitespace
      .replace(/\n{3,}/g, '\n\n'); // Reduce multiple empty lines
  }

  private getLanguageFromExtension(extension: string): string {
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      ts: 'TypeScript',
      py: 'Python',
      java: 'Java',
      cs: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      md: 'Markdown',
      yml: 'YAML',
      yaml: 'YAML',
      xml: 'XML'
    };

    return languageMap[extension.toLowerCase()] || 'Unknown';
  }

  private generateXmlOutput(result: FlattenResult): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<codebase>\n';
    xml += '  <metadata>\n';
    xml += `    <processedAt>${result.metadata.processedAt}</processedAt>\n`;
    xml += `    <totalFiles>${result.metadata.totalFiles}</totalFiles>\n`;
    xml += `    <totalSize>${result.metadata.totalSize}</totalSize>\n`;
    xml += '  </metadata>\n';
    
    xml += '  <directoryTree>\n';
    xml += `    <![CDATA[${result.directoryTree}]]>\n`;
    xml += '  </directoryTree>\n';
    
    xml += '  <files>\n';
    for (const file of result.files) {
      xml += '    <file>\n';
      xml += `      <path>${this.escapeXml(file.relativePath)}</path>\n`;
      xml += `      <language>${file.language}</language>\n`;
      xml += `      <size>${file.size}</size>\n`;
      xml += `      <lines>${file.lineCount}</lines>\n`;
      if (file.content) {
        xml += `      <content><![CDATA[${file.content}]]></content>\n`;
      }
      xml += '    </file>\n';
    }
    xml += '  </files>\n';
    xml += '</codebase>';
    
    return xml;
  }

  private generateJsonOutput(result: FlattenResult): string {
    return JSON.stringify(result, null, 2);
  }

  private generateMarkdownOutput(result: FlattenResult): string {
    let markdown = '# Codebase Flattened Output\n\n';
    
    markdown += '## Metadata\n\n';
    markdown += `- **Processed At**: ${result.metadata.processedAt}\n`;
    markdown += `- **Total Files**: ${result.metadata.totalFiles}\n`;
    markdown += `- **Total Size**: ${formatBytes(result.metadata.totalSize)}\n\n`;
    
    markdown += '## Directory Structure\n\n';
    markdown += '```\n';
    markdown += result.directoryTree;
    markdown += '\n```\n\n';
    
    markdown += '## Files\n\n';
    for (const file of result.files) {
      markdown += `### ${file.relativePath}\n\n`;
      markdown += `- **Language**: ${file.language}\n`;
      markdown += `- **Size**: ${formatBytes(file.size)}\n`;
      markdown += `- **Lines**: ${file.lineCount}\n\n`;
      
      if (file.content) {
        markdown += '```' + file.language.toLowerCase() + '\n';
        markdown += file.content;
        markdown += '\n```\n\n';
      }
    }
    
    return markdown;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private getFileIcon(filename: string): string {
    const extension = getFileExtension(filename);
    const iconMap: Record<string, string> = {
      js: '📜 ',
      ts: '🔷 ',
      py: '🐍 ',
      html: '🌐 ',
      css: '🎨 ',
      json: '📋 ',
      md: '📝 '
    };
    
    return iconMap[extension.toLowerCase()] || '📄 ';
  }
}