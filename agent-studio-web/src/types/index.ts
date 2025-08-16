export interface Agent {
  id: string;
  name: string;
  type: 'analyst' | 'pm' | 'architect' | 'scrum-master';
  status: 'active' | 'idle' | 'stopped';
  description: string;
  lastActivity: string;
  configuration?: Record<string, any>;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  progress: number;
  assignedAgent: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  createdDate: string;
  dueDate: string;
  tags?: string[];
  requirements?: string[];
  acceptanceCriteria?: string[];
}

export interface ExpansionPack {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'education' | 'creative' | 'development' | 'wellness';
  rating: number;
  downloads: number;
  author: string;
  version: string;
  installed: boolean;
  price: 'free' | 'premium';
  features: string[];
  dependencies?: string[];
  documentation?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  createdDate: string;
  lastModified: string;
  stories: Story[];
  agents: Agent[];
  settings: ProjectSettings;
}

export interface ProjectSettings {
  enableNotifications: boolean;
  autoSave: boolean;
  collaborationMode: 'sequential' | 'parallel';
  outputFormat: 'markdown' | 'json' | 'xml';
  maxStoryComplexity: number;
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  included: boolean;
  children?: FileItem[];
  lastModified?: string;
  language?: string;
}

export interface FlattenerConfig {
  includeComments: boolean;
  includeTests: boolean;
  minifyOutput: boolean;
  outputFormat: 'xml' | 'json' | 'markdown';
  excludePatterns: string[];
  includePatterns: string[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  type: Agent['type'];
  description: string;
  defaultConfig: Record<string, any>;
  requiredFields: string[];
  capabilities: string[];
}

export interface Collaboration {
  id: string;
  storyId: string;
  agents: string[];
  status: 'pending' | 'in-progress' | 'completed';
  startDate: string;
  endDate?: string;
  artifacts: CollaborationArtifact[];
}

export interface CollaborationArtifact {
  id: string;
  type: 'prd' | 'architecture' | 'story' | 'review';
  title: string;
  content: string;
  author: string;
  createdDate: string;
  version: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}