import type { Agent, Story, FileItem } from '../types';
import { FILE_EXTENSIONS } from './constants';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getAgentStatusColor = (status: Agent['status']) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'idle':
      return 'warning';
    case 'stopped':
      return 'error';
    default:
      return 'default';
  }
};

export const getStoryStatusColor = (status: Story['status']) => {
  switch (status) {
    case 'planning':
      return 'info';
    case 'in-progress':
      return 'warning';
    case 'review':
      return 'secondary';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

export const getPriorityColor = (priority: Story['priority']) => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

export const calculateStoryProgress = (story: Story): number => {
  if (story.status === 'completed') return 100;
  if (story.status === 'review') return 90;
  if (story.status === 'in-progress') return Math.min(story.progress, 85);
  return Math.min(story.progress, 25);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileLanguage = (filename: string): string => {
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  
  for (const [language, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if ((extensions as readonly string[]).includes(extension)) {
      return language.toLowerCase();
    }
  }
  
  return 'text';
};

export const shouldIncludeFile = (file: FileItem, excludePatterns: string[]): boolean => {
  const filename = file.name.toLowerCase();
  const filepath = file.path.toLowerCase();
  
  return !excludePatterns.some(pattern => {
    const patternLower = pattern.toLowerCase();
    return filename.includes(patternLower) || filepath.includes(patternLower);
  });
};

export const calculateProjectStats = (stories: Story[]) => {
  const total = stories.length;
  const completed = stories.filter(s => s.status === 'completed').length;
  const inProgress = stories.filter(s => s.status === 'in-progress').length;
  const planning = stories.filter(s => s.status === 'planning').length;
  
  const totalHours = stories.reduce((sum, story) => sum + story.estimatedHours, 0);
  const completedHours = stories
    .filter(s => s.status === 'completed')
    .reduce((sum, story) => sum + story.estimatedHours, 0);
  
  const averageProgress = total > 0 
    ? stories.reduce((sum, story) => sum + story.progress, 0) / total 
    : 0;
  
  return {
    total,
    completed,
    inProgress,
    planning,
    totalHours,
    completedHours,
    averageProgress: Math.round(averageProgress),
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

export const validateStoryForm = (story: Partial<Story>): string[] => {
  const errors: string[] = [];
  
  if (!story.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!story.description?.trim()) {
    errors.push('Description is required');
  }
  
  if (!story.estimatedHours || story.estimatedHours <= 0) {
    errors.push('Estimated hours must be greater than 0');
  }
  
  if (!story.dueDate) {
    errors.push('Due date is required');
  } else if (new Date(story.dueDate) <= new Date()) {
    errors.push('Due date must be in the future');
  }
  
  if (!story.assignedAgent?.trim()) {
    errors.push('Assigned agent is required');
  }
  
  return errors;
};

export const validateAgentForm = (agent: Partial<Agent>): string[] => {
  const errors: string[] = [];
  
  if (!agent.name?.trim()) {
    errors.push('Agent name is required');
  }
  
  if (!agent.type) {
    errors.push('Agent type is required');
  }
  
  if (!agent.description?.trim()) {
    errors.push('Agent description is required');
  }
  
  return errors;
};

export const exportToJson = (data: any, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
};

export const sortStoriesByPriority = (stories: Story[]): Story[] => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return [...stories].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
};

export const sortStoriesByStatus = (stories: Story[]): Story[] => {
  const statusOrder = { 'in-progress': 4, planning: 3, review: 2, completed: 1 };
  return [...stories].sort((a, b) => statusOrder[b.status] - statusOrder[a.status]);
};

export const groupStoriesByStatus = (stories: Story[]): Record<string, Story[]> => {
  return stories.reduce((groups, story) => {
    const status = story.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(story);
    return groups;
  }, {} as Record<string, Story[]>);
};