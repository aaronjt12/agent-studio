export const AGENT_TYPES = {
  ANALYST: 'analyst',
  PM: 'pm',
  ARCHITECT: 'architect',
  SCRUM_MASTER: 'scrum-master',
} as const;

export const STORY_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const EXPANSION_PACK_CATEGORIES = {
  BUSINESS: 'business',
  EDUCATION: 'education',
  CREATIVE: 'creative',
  DEVELOPMENT: 'development',
  WELLNESS: 'wellness',
} as const;

export const FILE_EXTENSIONS = {
  TYPESCRIPT: ['.ts', '.tsx'],
  JAVASCRIPT: ['.js', '.jsx'],
  PYTHON: ['.py'],
  JAVA: ['.java'],
  CSHARP: ['.cs'],
  HTML: ['.html', '.htm'],
  CSS: ['.css', '.scss', '.sass', '.less'],
  JSON: ['.json'],
  MARKDOWN: ['.md', '.markdown'],
  YAML: ['.yml', '.yaml'],
  XML: ['.xml'],
} as const;

export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.DS_Store',
  '*.log',
  '*.lock',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
];

export const API_ENDPOINTS = {
  AGENTS: '/api/agents',
  STORIES: '/api/stories',
  EXPANSION_PACKS: '/api/expansion-packs',
  PROJECTS: '/api/projects',
  CODEBASE_FLATTEN: '/api/codebase/flatten',
} as const;

export const LOCAL_STORAGE_KEYS = {
  USER_PREFERENCES: 'bmad_user_preferences',
  PROJECTS: 'bmad_projects',
  AGENTS: 'bmad_agents',
  STORIES: 'bmad_stories',
  THEME: 'bmad_theme',
} as const;

export const QUICK_START_STEPS = [
  {
    id: 'setup-agents',
    title: 'Configure AI Agents',
    description: 'Set up your collaborative AI agents for planning and development',
    completed: false,
  },
  {
    id: 'create-project',
    title: 'Create Your First Project',
    description: 'Start a new project to organize your development workflow',
    completed: false,
  },
  {
    id: 'generate-story',
    title: 'Generate Development Story',
    description: 'Let AI agents collaborate to create detailed development stories',
    completed: false,
  },
  {
    id: 'flatten-codebase',
    title: 'Try Codebase Flattener',
    description: 'Convert your codebase to AI-friendly format for analysis',
    completed: false,
  },
];

export const AGENT_TEMPLATES = [
  {
    id: 'requirements-analyst',
    name: 'Requirements Analyst',
    type: 'analyst' as const,
    description: 'Specializes in gathering and analyzing business requirements',
    capabilities: [
      'Requirement gathering',
      'Stakeholder analysis',
      'Use case definition',
      'Acceptance criteria creation',
    ],
    defaultConfig: {
      analysisDepth: 'detailed',
      includeEdgeCases: true,
      generateUserStories: true,
    },
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    type: 'pm' as const,
    description: 'Focuses on product strategy and roadmap planning',
    capabilities: [
      'Product roadmap creation',
      'Feature prioritization',
      'Market analysis',
      'Stakeholder communication',
    ],
    defaultConfig: {
      roadmapHorizon: '6_months',
      prioritizationMethod: 'rice',
      includeMetrics: true,
    },
  },
  {
    id: 'system-architect',
    name: 'System Architect',
    type: 'architect' as const,
    description: 'Designs scalable and maintainable system architectures',
    capabilities: [
      'System design',
      'Technology selection',
      'Performance optimization',
      'Security considerations',
    ],
    defaultConfig: {
      architectureStyle: 'microservices',
      scalabilityFocus: 'horizontal',
      includeSecurityReview: true,
    },
  },
  {
    id: 'scrum-master',
    name: 'Scrum Master',
    type: 'scrum-master' as const,
    description: 'Facilitates agile development and story breakdown',
    capabilities: [
      'Story breakdown',
      'Sprint planning',
      'Process improvement',
      'Team coordination',
    ],
    defaultConfig: {
      sprintDuration: 2,
      storyPointScale: 'fibonacci',
      includeRisks: true,
    },
  },
];

export const COLLABORATION_FLOWS = [
  {
    name: 'Full Analysis Flow',
    description: 'Complete analysis from requirements to implementation stories',
    agents: ['analyst', 'pm', 'architect', 'scrum-master'],
    estimatedTime: '2-4 hours',
  },
  {
    name: 'Quick Planning',
    description: 'Rapid planning for simple features',
    agents: ['pm', 'scrum-master'],
    estimatedTime: '30-60 minutes',
  },
  {
    name: 'Technical Deep Dive',
    description: 'Architecture-focused analysis for complex systems',
    agents: ['architect', 'analyst', 'scrum-master'],
    estimatedTime: '3-6 hours',
  },
];

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;