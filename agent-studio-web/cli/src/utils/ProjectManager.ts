import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { generateId } from './helpers';

export interface ProjectStatus {
  name: string;
  description: string;
  createdAt: string;
  stories: {
    total: number;
    completed: number;
    inProgress: number;
    planning: number;
    completionRate: number;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    stopped: number;
  };
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'story_created' | 'story_completed' | 'agent_started' | 'collaboration_started';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ExportOptions {
  format: 'json' | 'yaml' | 'xml';
  include: string[];
}

export class ProjectManager {
  private configDir: string;
  private configFile: string;
  private storiesFile: string;
  private activityFile: string;

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(process.cwd(), '.bmad');
    this.configFile = path.join(this.configDir, 'config.yaml');
    this.storiesFile = path.join(this.configDir, 'stories.json');
    this.activityFile = path.join(this.configDir, 'activity.json');
  }

  async getProjectStatus(): Promise<ProjectStatus> {
    try {
      // Load project config
      const config = await this.loadConfig();
      
      // Load stories
      const stories = await this.loadStories();
      
      // Load agents (assuming AgentManager data)
      const agents = await this.loadAgents();
      
      // Load recent activity
      const recentActivity = await this.loadRecentActivity();

      // Calculate story statistics
      const storyStats = {
        total: stories.length,
        completed: stories.filter((s: any) => s.status === 'completed').length,
        inProgress: stories.filter((s: any) => s.status === 'in-progress').length,
        planning: stories.filter((s: any) => s.status === 'planning').length,
        completionRate: 0
      };
      storyStats.completionRate = storyStats.total > 0 ? 
        Math.round((storyStats.completed / storyStats.total) * 100) : 0;

      // Calculate agent statistics
      const agentStats = {
        total: agents.length,
        active: agents.filter((a: any) => a.status === 'active').length,
        idle: agents.filter((a: any) => a.status === 'idle').length,
        stopped: agents.filter((a: any) => a.status === 'stopped').length
      };

      return {
        name: config.project?.name || 'Unnamed Project',
        description: config.project?.description || 'No description',
        createdAt: config.project?.createdAt || new Date().toISOString(),
        stories: storyStats,
        agents: agentStats,
        recentActivity: recentActivity.slice(0, 10) // Last 10 activities
      };

    } catch (error: any) {
      // Return default status if project not initialized
      return {
        name: 'New Project',
        description: 'Initialize with: bmad init',
        createdAt: new Date().toISOString(),
        stories: { total: 0, completed: 0, inProgress: 0, planning: 0, completionRate: 0 },
        agents: { total: 0, active: 0, idle: 0, stopped: 0 },
        recentActivity: []
      };
    }
  }

  async exportProject(options: ExportOptions): Promise<string> {
    const config = await this.loadConfig();
    const stories = options.include.includes('stories') ? await this.loadStories() : [];
    const agents = options.include.includes('agents') ? await this.loadAgents() : [];
    const activity = await this.loadRecentActivity();

    const exportData = {
      project: config.project,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      ...(options.include.includes('config') && { config }),
      ...(options.include.includes('stories') && { stories }),
      ...(options.include.includes('agents') && { agents }),
      activity: activity.slice(0, 50), // Last 50 activities
      metadata: {
        totalStories: stories.length,
        totalAgents: agents.length,
        exportOptions: options
      }
    };

    switch (options.format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'yaml':
        return yaml.stringify(exportData);
      case 'xml':
        return this.convertToXml(exportData);
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  async logActivity(type: ActivityItem['type'], message: string, metadata?: Record<string, any>): Promise<void> {
    const activity: ActivityItem = {
      id: generateId(),
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };

    try {
      const activities = await this.loadRecentActivity();
      activities.unshift(activity); // Add to beginning
      
      // Keep only last 100 activities
      const trimmedActivities = activities.slice(0, 100);
      
      await fs.ensureDir(this.configDir);
      await fs.writeJson(this.activityFile, { activities: trimmedActivities }, { spaces: 2 });
    } catch (error: any) {
      console.warn('Could not log activity:', error instanceof Error ? error.message : String(error));
    }
  }

  async createStory(story: any): Promise<void> {
    const stories = await this.loadStories();
    const newStory = {
      id: generateId(),
      ...story,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    stories.push(newStory);
    await this.saveStories(stories);
    
    await this.logActivity('story_created', `Created story: ${story.title}`, { storyId: newStory.id });
  }

  async updateStory(storyId: string, updates: any): Promise<void> {
    const stories = await this.loadStories();
    const storyIndex = stories.findIndex((s: any) => s.id === storyId);
    
    if (storyIndex === -1) {
      throw new Error(`Story not found: ${storyId}`);
    }

    stories[storyIndex] = {
      ...stories[storyIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveStories(stories);

    if (updates.status === 'completed') {
      await this.logActivity('story_completed', `Completed story: ${stories[storyIndex].title}`, { storyId });
    }
  }

  async getStories(): Promise<any[]> {
    return await this.loadStories();
  }

  async getStory(storyId: string): Promise<any | null> {
    const stories = await this.loadStories();
    return stories.find((s: any) => s.id === storyId) || null;
  }

  async deleteStory(storyId: string): Promise<void> {
    const stories = await this.loadStories();
    const updatedStories = stories.filter((s: any) => s.id !== storyId);
    await this.saveStories(updatedStories);
  }

  async initializeProject(config: any): Promise<void> {
    await fs.ensureDir(this.configDir);
    await fs.ensureDir(path.join(this.configDir, 'agents'));
    await fs.ensureDir(path.join(this.configDir, 'stories'));
    await fs.ensureDir(path.join(this.configDir, 'temp'));

    // Create initial config
    const projectConfig = {
      project: {
        ...config,
        version: '1.0.0',
        createdAt: new Date().toISOString()
      },
      agents: {
        enabled: config.agents || [],
        autoStart: false,
        collaborationMode: 'sequential'
      },
      development: {
        autoSave: true,
        backupStories: true,
        verboseLogging: false
      }
    };

    await fs.writeFile(this.configFile, yaml.stringify(projectConfig));

    // Initialize empty data files
    await fs.writeJson(this.storiesFile, { stories: [] }, { spaces: 2 });
    await fs.writeJson(this.activityFile, { activities: [] }, { spaces: 2 });

    await this.logActivity('story_created', 'Project initialized', { projectName: config.name });
  }

  async isProjectInitialized(): Promise<boolean> {
    return await fs.pathExists(this.configFile);
  }

  async getProjectConfig(): Promise<any> {
    return await this.loadConfig();
  }

  async updateProjectConfig(updates: any): Promise<void> {
    const config = await this.loadConfig();
    const updatedConfig = { ...config, ...updates };
    await fs.writeFile(this.configFile, yaml.stringify(updatedConfig));
  }

  private async loadConfig(): Promise<any> {
    if (!await fs.pathExists(this.configFile)) {
      return {};
    }
    
    const content = await fs.readFile(this.configFile, 'utf8');
    return yaml.parse(content);
  }

  private async loadStories(): Promise<any[]> {
    try {
      if (!await fs.pathExists(this.storiesFile)) {
        return [];
      }
      
      const data = await fs.readJson(this.storiesFile);
      return data.stories || [];
    } catch (error: any) {
      return [];
    }
  }

  private async saveStories(stories: any[]): Promise<void> {
    await fs.ensureDir(this.configDir);
    await fs.writeJson(this.storiesFile, { 
      stories,
      lastUpdated: new Date().toISOString()
    }, { spaces: 2 });
  }

  private async loadAgents(): Promise<any[]> {
    try {
      const agentsFile = path.join(this.configDir, 'agents.json');
      if (!await fs.pathExists(agentsFile)) {
        return [];
      }
      
      const data = await fs.readJson(agentsFile);
      return Object.values(data.agents || {});
    } catch (error: any) {
      return [];
    }
  }

  private async loadRecentActivity(): Promise<ActivityItem[]> {
    try {
      if (!await fs.pathExists(this.activityFile)) {
        return [];
      }
      
      const data = await fs.readJson(this.activityFile);
      return data.activities || [];
    } catch (error: any) {
      return [];
    }
  }

  private convertToXml(data: any): string {
    function objectToXml(obj: any, rootName: string = 'root'): string {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
      
      function processValue(value: any, key?: string): string {
        const tagName = key || 'item';
        
        if (value === null || value === undefined) {
          return `  <${tagName} />\n`;
        }
        
        if (Array.isArray(value)) {
          let result = `  <${tagName}>\n`;
          value.forEach((item, index) => {
            result += processValue(item, 'item').replace(/^/gm, '  ');
          });
          result += `  </${tagName}>\n`;
          return result;
        }
        
        if (typeof value === 'object') {
          let result = `  <${tagName}>\n`;
          Object.entries(value).forEach(([k, v]) => {
            result += processValue(v, k).replace(/^/gm, '  ');
          });
          result += `  </${tagName}>\n`;
          return result;
        }
        
        // Escape XML special characters
        const escapedValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        
        return `  <${tagName}>${escapedValue}</${tagName}>\n`;
      }
      
      Object.entries(data).forEach(([key, value]) => {
        xml += processValue(value, key);
      });
      
      xml += `</${rootName}>`;
      return xml;
    }
    
    return objectToXml(data, 'bmad-export');
  }
}