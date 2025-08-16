// Export interfaces first
export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  activities: string[];
  agentInvolvement: string[];
  deliverables: string[];
}

export interface AgentRole {
  agentType: string;
  primaryResponsibilities: string[];
  collaborationPoints: string[];
  deliverables: string[];
}

export interface AgentStudioWorkflow {
  id: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  agentRoles: AgentRole[];
  deliverables: string[];
  estimatedDuration: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Test export to verify module is working
export const TEST_EXPORT = "AGENT_STUDIO agentWorkflows Module is Working";

export const AGENT_STUDIO_WORKFLOWS: AgentStudioWorkflow[] = [
  {
    id: 'requirements-analysis',
    name: 'Requirements Analysis & Planning',
    description: 'Comprehensive requirements gathering, analysis, and project planning workflow',
    phases: [
      {
        id: 'discovery',
        name: 'Discovery & Stakeholder Engagement',
        description: 'Initial stakeholder interviews and requirement discovery',
        duration: '1-2 weeks',
        activities: [
          'Stakeholder interviews',
          'Business process analysis',
          'Current state assessment',
          'Pain point identification'
        ],
        agentInvolvement: ['Alex (Analyst)', 'Karen (PM)'],
        deliverables: ['Stakeholder map', 'Business process flows', 'Pain point summary']
      },
      {
        id: 'requirements-gathering',
        name: 'Requirements Gathering & Documentation',
        description: 'Detailed requirements collection and documentation',
        duration: '2-3 weeks',
        activities: [
          'User story workshops',
          'Functional requirements definition',
          'Non-functional requirements analysis',
          'Acceptance criteria development'
        ],
        agentInvolvement: ['Alex (Analyst)', 'Karen (PM)', 'Mike (Architect)'],
        deliverables: ['User stories', 'Requirements document', 'Acceptance criteria']
      },
      {
        id: 'planning',
        name: 'Project Planning & Estimation',
        description: 'Project planning, estimation, and resource allocation',
        duration: '1-2 weeks',
        activities: [
          'Project scope definition',
          'Timeline estimation',
          'Resource planning',
          'Risk assessment'
        ],
        agentInvolvement: ['Karen (PM)', 'Sarah (Scrum Master)', 'Mike (Architect)'],
        deliverables: ['Project plan', 'Timeline', 'Resource allocation', 'Risk register']
      }
    ],
    agentRoles: [
      {
        agentType: 'ANALYST',
        primaryResponsibilities: [
          'Lead requirements gathering sessions',
          'Document functional and non-functional requirements',
          'Create user stories and acceptance criteria',
          'Facilitate stakeholder communication'
        ],
        collaborationPoints: [
          'Work with PM on scope and priorities',
          'Collaborate with Architect on technical feasibility',
          'Coordinate with Scrum Master on sprint planning'
        ],
        deliverables: [
          'Requirements specification document',
          'User story backlog',
          'Acceptance criteria matrix'
        ]
      },
      {
        agentType: 'PM',
        primaryResponsibilities: [
          'Define project scope and objectives',
          'Manage stakeholder expectations',
          'Prioritize requirements',
          'Create project timeline and budget'
        ],
        collaborationPoints: [
          'Guide Analyst on business priorities',
          'Work with Architect on technical constraints',
          'Coordinate with Scrum Master on delivery approach'
        ],
        deliverables: [
          'Project charter',
          'Scope statement',
          'Project timeline',
          'Budget estimate'
        ]
      },
      {
        agentType: 'ARCHITECT',
        primaryResponsibilities: [
          'Assess technical feasibility',
          'Define system architecture',
          'Identify technical constraints',
          'Create technical specifications'
        ],
        collaborationPoints: [
          'Support Analyst with technical requirements',
          'Advise PM on technical risks and constraints',
          'Guide development team on implementation approach'
        ],
        deliverables: [
          'Technical feasibility assessment',
          'High-level architecture design',
          'Technical constraints document'
        ]
      }
    ],
    deliverables: [
      'Comprehensive requirements document',
      'User story backlog with acceptance criteria',
      'Project plan with timeline and resources',
      'Technical feasibility assessment',
      'Risk register and mitigation strategies'
    ],
    estimatedDuration: '4-7 weeks',
    complexity: 'MEDIUM'
  },
  {
    id: 'design-implementation',
    name: 'Design & Implementation',
    description: 'User experience design and frontend implementation workflow',
    phases: [
      {
        id: 'research-design',
        name: 'User Research & Design',
        description: 'User research, wireframing, and visual design',
        duration: '2-3 weeks',
        activities: [
          'User research and interviews',
          'Persona development',
          'Wireframe creation',
          'Visual design development',
          'Usability testing'
        ],
        agentInvolvement: ['Lisa (Designer)', 'Alex (Analyst)', 'Karen (PM)'],
        deliverables: ['User personas', 'Wireframes', 'Visual designs', 'Usability test results']
      },
      {
        id: 'frontend-implementation',
        name: 'Frontend Implementation',
        description: 'Frontend development and design system implementation',
        duration: '2-4 weeks',
        activities: [
          'Component development',
          'Design system implementation',
          'Responsive design',
          'Accessibility implementation',
          'Cross-browser testing'
        ],
        agentInvolvement: ['Lisa (Designer)', 'David (Developer)', 'Emma (Tester)'],
        deliverables: ['Frontend components', 'Design system', 'Responsive layouts', 'Accessibility features']
      },
      {
        id: 'validation-iteration',
        name: 'Design Validation & Iteration',
        description: 'User testing, feedback collection, and design iteration',
        duration: '1-2 weeks',
        activities: [
          'User acceptance testing',
          'Feedback collection and analysis',
          'Design iteration and refinement',
          'Final validation and approval'
        ],
        agentInvolvement: ['Lisa (Designer)', 'Emma (Tester)', 'Karen (PM)'],
        deliverables: ['User feedback report', 'Design iteration documentation', 'Final design approval']
      }
    ],
    agentRoles: [
      {
        agentType: 'DESIGNER',
        primaryResponsibilities: [
          'Lead user research and design activities',
          'Create wireframes and visual designs',
          'Develop design systems and guidelines',
          'Conduct usability testing'
        ],
        collaborationPoints: [
          'Work with Analyst on user needs',
          'Collaborate with Developer on implementation',
          'Coordinate with PM on design priorities'
        ],
        deliverables: [
          'User research findings',
          'Design mockups and prototypes',
          'Design system documentation',
          'Usability test reports'
        ]
      },
      {
        agentType: 'DEVELOPER',
        primaryResponsibilities: [
          'Implement frontend designs',
          'Develop reusable components',
          'Ensure responsive design',
          'Implement accessibility features'
        ],
        collaborationPoints: [
          'Work with Designer on implementation feasibility',
          'Collaborate with Tester on frontend testing',
          'Coordinate with DevOps on deployment'
        ],
        deliverables: [
          'Frontend components',
          'Responsive layouts',
          'Accessibility features',
          'Component documentation'
        ]
      }
    ],
    deliverables: [
      'User research and personas',
      'Complete design system',
      'Frontend implementation',
      'Usability test results',
      'Design validation report'
    ],
    estimatedDuration: '5-9 weeks',
    complexity: 'HIGH'
  },
  {
    id: 'development-sprint',
    name: 'Development Sprint Execution',
    description: 'Agile development sprint with continuous integration and testing',
    phases: [
      {
        id: 'sprint-planning',
        name: 'Sprint Planning & Setup',
        description: 'Sprint goal setting, story breakdown, and team preparation',
        duration: '1-2 days',
        activities: [
          'Sprint goal definition',
          'Story breakdown and estimation',
          'Team capacity planning',
          'Definition of Done agreement'
        ],
        agentInvolvement: ['Sarah (Scrum Master)', 'David (Developer)', 'Emma (Tester)'],
        deliverables: ['Sprint backlog', 'Sprint goal', 'Team commitments']
      },
      {
        id: 'development',
        name: 'Development & Testing',
        description: 'Feature development with continuous testing and integration',
        duration: '1-2 weeks',
        activities: [
          'Feature implementation',
          'Unit testing',
          'Code reviews',
          'Continuous integration',
          'Integration testing'
        ],
        agentInvolvement: ['David (Developer)', 'Emma (Tester)', 'Tom (DevOps)'],
        deliverables: ['Working software', 'Test results', 'Code documentation']
      },
      {
        id: 'review-retrospective',
        name: 'Sprint Review & Retrospective',
        description: 'Sprint review, stakeholder demo, and team improvement',
        duration: '1 day',
        activities: [
          'Sprint review with stakeholders',
          'Working software demonstration',
          'Feedback collection',
          'Team retrospective',
          'Process improvement planning'
        ],
        agentInvolvement: ['Sarah (Scrum Master)', 'Karen (PM)', 'All team members'],
        deliverables: ['Sprint review notes', 'Stakeholder feedback', 'Improvement action items']
      }
    ],
    agentRoles: [
      {
        agentType: 'DEVELOPER',
        primaryResponsibilities: [
          'Implement features according to specifications',
          'Write clean, maintainable code',
          'Perform unit testing',
          'Participate in code reviews'
        ],
        collaborationPoints: [
          'Work with Tester on test scenarios',
          'Collaborate with DevOps on deployment',
          'Coordinate with Architect on technical decisions'
        ],
        deliverables: [
          'Working features',
          'Unit tests',
          'Code documentation'
        ]
      },
      {
        agentType: 'TESTER',
        primaryResponsibilities: [
          'Design and execute test cases',
          'Perform functional and integration testing',
          'Report and track bugs',
          'Validate acceptance criteria'
        ],
        collaborationPoints: [
          'Work with Developer on test scenarios',
          'Collaborate with PM on acceptance criteria',
          'Coordinate with DevOps on test environments'
        ],
        deliverables: [
          'Test plans and cases',
          'Test results and reports',
          'Bug reports and tracking'
        ]
      },
      {
        agentType: 'SCRUM_MASTER',
        primaryResponsibilities: [
          'Facilitate sprint ceremonies',
          'Remove team impediments',
          'Coach team on agile practices',
          'Track sprint progress'
        ],
        collaborationPoints: [
          'Guide team through sprint execution',
          'Coordinate with PM on stakeholder communication',
          'Support team in process improvement'
        ],
        deliverables: [
          'Sprint metrics and reports',
          'Impediment logs',
          'Process improvement plans'
        ]
      }
    ],
    deliverables: [
      'Working software increment',
      'Test results and quality metrics',
      'Sprint review documentation',
      'Team improvement action items',
      'Updated product backlog'
    ],
    estimatedDuration: '2-3 weeks',
    complexity: 'MEDIUM'
  }
];

export const getWorkflowById = (id: string): AgentStudioWorkflow | undefined => {
  return AGENT_STUDIO_WORKFLOWS.find(workflow => workflow.id === id);
};

export const getWorkflowsByComplexity = (complexity: 'LOW' | 'MEDIUM' | 'HIGH'): AgentStudioWorkflow[] => {
  return AGENT_STUDIO_WORKFLOWS.filter(workflow => workflow.complexity === complexity);
};

export const getWorkflowsByAgentType = (agentType: string): AgentStudioWorkflow[] => {
  return AGENT_STUDIO_WORKFLOWS.filter(workflow => 
    workflow.agentRoles.some(role => role.agentType === agentType)
  );
};
