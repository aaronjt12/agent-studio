import crypto from 'crypto';

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function pluralize(count: number, word: string, suffix: string = 's'): string {
  return count === 1 ? word : word + suffix;
}

export function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length - 3) + '...' : text;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function isValidFileName(filename: string): boolean {
  const invalidChars = /[<>:"/\\|?*]/g;
  return !invalidChars.test(filename) && filename.trim().length > 0;
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export function parseCommandArgs(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    args.push(current);
  }

  return args;
}

export function colorizeJson(obj: any): string {
  const chalk = require('chalk');
  
  function colorize(value: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    
    if (value === null) {
      return chalk.gray('null');
    }
    
    if (typeof value === 'boolean') {
      return chalk.yellow(value.toString());
    }
    
    if (typeof value === 'number') {
      return chalk.cyan(value.toString());
    }
    
    if (typeof value === 'string') {
      return chalk.green(`"${value}"`);
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      
      const items = value.map(item => 
        spaces + '  ' + colorize(item, indent + 1)
      ).join(',\n');
      
      return `[\n${items}\n${spaces}]`;
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      
      const items = entries.map(([key, val]) => 
        `${spaces}  ${chalk.blue(key)}: ${colorize(val, indent + 1)}`
      ).join(',\n');
      
      return `{\n${items}\n${spaces}}`;
    }
    
    return value.toString();
  }
  
  return colorize(obj);
}

export function createProgressBar(completed: number, total: number, width: number = 20): string {
  const percentage = Math.min(completed / total, 1);
  const filled = Math.round(width * percentage);
  const empty = width - filled;
  
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export function parseConfigValue(value: string): any {
  // Try to parse as JSON first
  try {
    return JSON.parse(value);
  } catch {
    // If not JSON, try boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Try number
    const num = Number(value);
    if (!isNaN(num)) return num;
    
    // Return as string
    return value;
  }
}

export function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot + 1).toLowerCase();
}

export function isCodeFile(filename: string): boolean {
  const codeExtensions = [
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php',
    'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'sql', 'html',
    'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'json', 'yaml',
    'yml', 'xml', 'md', 'dockerfile', 'sh', 'bat', 'ps1'
  ];
  
  const ext = getFileExtension(filename);
  return codeExtensions.includes(ext);
}

export function estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function createHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}