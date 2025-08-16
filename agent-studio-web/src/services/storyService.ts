// Unified Story Service for both Story Manager and BMAD Workflows

export interface UnifiedStory {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'task' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'planning' | 'in-progress' | 'review' | 'testing' | 'done' | 'completed';
  progress: number;
  assignedAgent?: string;
  estimatedHours?: number;
  actualHours?: number;
  phase?: string; // For BMAD workflow phases
  projectId?: string; // For BMAD workflow projects
  workflowId?: string; // Link to BMAD workflow
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags?: string[];
  acceptance_criteria?: string[];
}

export interface StoryProject {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'completed' | 'paused';
  workflowId?: string; // Link to BMAD workflow
  createdAt: Date;
  updatedAt: Date;
}

class StoryService {
  private stories: UnifiedStory[] = [];
  private projects: StoryProject[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    // Load existing mock data and convert to unified format
    this.stories = [
      {
        id: '1',
        title: 'User Authentication System',
        description: 'Implement JWT-based authentication with role management',
        type: 'feature',
        priority: 'high',
        status: 'in-progress',
        progress: 75,
        assignedAgent: 'System Architect',
        estimatedHours: 16,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-18'),
        dueDate: new Date('2024-01-20'),
        tags: ['authentication', 'security'],
        acceptance_criteria: [
          'User can register with email and password',
          'User can login and receive JWT token',
          'Role-based access control is implemented'
        ]
      },
      {
        id: '2',
        title: 'API Gateway Implementation',
        description: 'Create centralized API gateway with rate limiting and logging',
        type: 'feature',
        priority: 'medium',
        status: 'planning',
        progress: 25,
        assignedAgent: 'Requirements Analyst',
        estimatedHours: 24,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
        dueDate: new Date('2024-01-25'),
        tags: ['api', 'gateway', 'infrastructure'],
        acceptance_criteria: [
          'Central API gateway is deployed',
          'Rate limiting is configured',
          'Request/response logging is implemented'
        ]
      },
      {
        id: '3',
        title: 'Database Migration Tool',
        description: 'Build tool for seamless database schema migrations',
        type: 'task',
        priority: 'low',
        status: 'completed',
        progress: 100,
        assignedAgent: 'Product Manager',
        estimatedHours: 8,
        actualHours: 7,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        dueDate: new Date('2024-01-15'),
        tags: ['database', 'migration', 'tooling']
      }
    ];

    this.projects = [
      {
        id: 'project_1',
        name: 'Authentication & Security Module',
        description: 'Complete authentication and security implementation',
        type: 'Web Application',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-18')
      }
    ];
  }

  // Story CRUD operations
  getAllStories(): UnifiedStory[] {
    return [...this.stories];
  }

  getStoriesByProject(projectId: string): UnifiedStory[] {
    return this.stories.filter(story => story.projectId === projectId);
  }

  getStoriesByWorkflow(workflowId: string): UnifiedStory[] {
    return this.stories.filter(story => story.workflowId === workflowId);
  }

  getStoriesByPhase(phase: string): UnifiedStory[] {
    return this.stories.filter(story => story.phase === phase);
  }

  getStoriesByStatus(status: UnifiedStory['status']): UnifiedStory[] {
    return this.stories.filter(story => story.status === status);
  }

  getStoryById(id: string): UnifiedStory | undefined {
    return this.stories.find(story => story.id === id);
  }

  createStory(story: Omit<UnifiedStory, 'id' | 'createdAt' | 'updatedAt'>): UnifiedStory {
    const newStory: UnifiedStory = {
      ...story,
      id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: story.progress || 0
    };

    this.stories.push(newStory);
    this.notifyListeners();
    return newStory;
  }

  updateStory(id: string, updates: Partial<UnifiedStory>): UnifiedStory | null {
    const index = this.stories.findIndex(story => story.id === id);
    if (index === -1) return null;

    this.stories[index] = {
      ...this.stories[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notifyListeners();
    return this.stories[index];
  }

  deleteStory(id: string): boolean {
    const index = this.stories.findIndex(story => story.id === id);
    if (index === -1) return false;

    this.stories.splice(index, 1);
    this.notifyListeners();
    return true;
  }

  // Bulk operations for BMAD workflows
  createStoriesFromWorkflow(
    workflow: any, 
    projectId: string, 
    workflowId: string
  ): UnifiedStory[] {
    const newStories: UnifiedStory[] = [];

    workflow.phases.forEach((phase: any, phaseIndex: number) => {
      // Create epic story for each phase
      const epicStory = this.createStory({
        title: `${phase.name} - Phase ${phaseIndex + 1}`,
        description: `${phase.description}\n\nActivities: ${phase.activities.join(', ')}\nDuration: ${phase.duration}`,
        type: 'epic',
        priority: phaseIndex === 0 ? 'high' : 'medium',
        status: phaseIndex === 0 ? 'in-progress' : 'backlog',
        progress: phaseIndex === 0 ? 10 : 0,
        phase: phase.name,
        projectId,
        workflowId,
        estimatedHours: this.estimateHoursFromDuration(phase.duration),
        tags: ['workflow', 'phase', phase.name.toLowerCase().replace(/\s+/g, '-')]
      });
      newStories.push(epicStory);

      // Create feature stories for each activity
      phase.activities.forEach((activity: string, activityIndex: number) => {
        const featureStory = this.createStory({
          title: activity,
          description: `Complete ${activity} for the ${phase.name} phase`,
          type: 'feature',
          priority: activityIndex === 0 ? 'high' : 'medium',
          status: phaseIndex === 0 ? 'in-progress' : 'backlog',
          progress: phaseIndex === 0 ? 5 : 0,
          phase: phase.name,
          projectId,
          workflowId,
          estimatedHours: 4, // Default estimate for activities
          tags: ['workflow', 'activity', phase.name.toLowerCase().replace(/\s+/g, '-')]
        });
        newStories.push(featureStory);
      });

      // Create task stories for deliverables
      phase.deliverables.forEach((deliverable: string, deliverableIndex: number) => {
        const taskStory = this.createStory({
          title: `Deliver: ${deliverable}`,
          description: `Create and deliver ${deliverable} for the ${phase.name} phase`,
          type: 'task',
          priority: 'medium',
          status: phaseIndex === 0 ? 'in-progress' : 'backlog',
          progress: phaseIndex === 0 ? 0 : 0,
          phase: phase.name,
          projectId,
          workflowId,
          estimatedHours: 2, // Default estimate for deliverables
          tags: ['workflow', 'deliverable', phase.name.toLowerCase().replace(/\s+/g, '-')]
        });
        newStories.push(taskStory);
      });
    });

    return newStories;
  }

  syncWorkflowProgress(workflowId: string, currentPhase: string, phaseIndex: number, totalPhases: number): void {
    const workflowStories = this.getStoriesByWorkflow(workflowId);
    
    workflowStories.forEach(story => {
      let newStatus: UnifiedStory['status'] = story.status;
      let newProgress = story.progress;

      if (story.phase === currentPhase) {
        newStatus = 'in-progress';
        newProgress = Math.max(story.progress, 25); // Minimum progress for current phase
      } else {
        // Find phase index for this story
        const storyPhaseIndex = this.getPhaseIndex(story.phase || '');
        if (storyPhaseIndex < phaseIndex) {
          newStatus = 'done';
          newProgress = 100;
        } else if (storyPhaseIndex > phaseIndex) {
          newStatus = 'backlog';
          newProgress = 0;
        }
      }

      if (story.status !== newStatus || story.progress !== newProgress) {
        this.updateStory(story.id, { status: newStatus, progress: newProgress });
      }
    });
  }

  private getPhaseIndex(phaseName: string): number {
    // Simple phase ordering - this could be made more sophisticated
    const phases = [
      'Discovery & Stakeholder Engagement',
      'Requirements Gathering & Documentation', 
      'Project Planning & Estimation',
      'Sprint Planning & Setup',
      'Development & Testing',
      'Sprint Review & Retrospective',
      'User Research & Design',
      'Frontend Implementation',
      'Design Validation & Iteration'
    ];
    return phases.indexOf(phaseName);
  }

  private estimateHoursFromDuration(duration: string): number {
    // Convert duration strings to estimated hours
    if (duration.includes('week')) {
      const weeks = parseInt(duration.match(/(\d+)/)?.[0] || '1');
      return weeks * 40; // 40 hours per week
    } else if (duration.includes('day')) {
      const days = parseInt(duration.match(/(\d+)/)?.[0] || '1');
      return days * 8; // 8 hours per day
    }
    return 8; // Default fallback
  }

  // Project operations
  getAllProjects(): StoryProject[] {
    return [...this.projects];
  }

  getProjectById(id: string): StoryProject | undefined {
    return this.projects.find(project => project.id === id);
  }

  createProject(project: Omit<StoryProject, 'id' | 'createdAt' | 'updatedAt'>): StoryProject {
    const newProject: StoryProject = {
      ...project,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.push(newProject);
    this.notifyListeners();
    return newProject;
  }

  updateProject(id: string, updates: Partial<StoryProject>): StoryProject | null {
    const index = this.projects.findIndex(project => project.id === id);
    if (index === -1) return null;

    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notifyListeners();
    return this.projects[index];
  }

  linkProjectToWorkflow(projectId: string, workflowId: string): boolean {
    const project = this.updateProject(projectId, { workflowId });
    return project !== null;
  }

  // Event listeners for real-time updates
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Statistics and analytics
  getStoryStatistics() {
    return {
      total: this.stories.length,
      byStatus: {
        backlog: this.stories.filter(s => s.status === 'backlog').length,
        planning: this.stories.filter(s => s.status === 'planning').length,
        inProgress: this.stories.filter(s => s.status === 'in-progress').length,
        review: this.stories.filter(s => s.status === 'review').length,
        testing: this.stories.filter(s => s.status === 'testing').length,
        done: this.stories.filter(s => s.status === 'done' || s.status === 'completed').length
      },
      byPriority: {
        critical: this.stories.filter(s => s.priority === 'critical').length,
        high: this.stories.filter(s => s.priority === 'high').length,
        medium: this.stories.filter(s => s.priority === 'medium').length,
        low: this.stories.filter(s => s.priority === 'low').length
      },
      byType: {
        epic: this.stories.filter(s => s.type === 'epic').length,
        feature: this.stories.filter(s => s.type === 'feature').length,
        task: this.stories.filter(s => s.type === 'task').length,
        bug: this.stories.filter(s => s.type === 'bug').length
      },
      averageProgress: this.stories.length > 0 
        ? this.stories.reduce((acc, story) => acc + story.progress, 0) / this.stories.length
        : 0,
      totalEstimatedHours: this.stories.reduce((acc, story) => acc + (story.estimatedHours || 0), 0),
      totalActualHours: this.stories.reduce((acc, story) => acc + (story.actualHours || 0), 0)
    };
  }
}

// Export singleton instance
export const storyService = new StoryService();
export default storyService;