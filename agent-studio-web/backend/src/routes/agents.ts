import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../server';
import { AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
// Use string enums (stored as strings in DB)
import { AIService } from '../services/AIService';

const router = Router();
const aiService = new AIService();

// Validation middleware
const validateRequest = (req: AuthenticatedRequest, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /api/agents - List all agents for the authenticated user
router.get('/', 
  [
    query('status').optional().isIn(['ACTIVE', 'IDLE', 'STOPPED', 'ERROR']),
    query('type').optional().isIn(['ANALYST', 'PM', 'ARCHITECT', 'SCRUM_MASTER', 'DEVELOPER', 'TESTER', 'DESIGNER', 'DEVOPS']),
    query('projectId').optional().isUUID(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { status, type, projectId } = req.query;
      
      const whereClause: any = {
        userId: req.user!.id,
      };

      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      
      if (projectId) {
        whereClause.projectAgents = {
          some: {
            projectId: projectId as string
          }
        };
      }

      const agents = await prisma.agent.findMany({
        where: whereClause,
        include: {
          projectAgents: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              conversations: true,
              storyAssignments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const agentsWithStats = agents.map(agent => ({
        ...agent,
        projects: agent.projectAgents.map(pa => pa.project),
        stats: {
          conversations: agent._count.conversations,
          assignments: agent._count.storyAssignments
        }
      }));

      res.json(agentsWithStats);
    } catch (error) {
      console.error('Get agents error:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  }
);

// POST /api/agents - Create a new agent
router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('type').isIn(['ANALYST', 'PM', 'ARCHITECT', 'SCRUM_MASTER', 'DEVELOPER', 'TESTER', 'DESIGNER', 'DEVOPS']),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('systemPrompt').optional().isLength({ max: 2000 }).withMessage('System prompt must be less than 2000 characters'),
    body('configuration').optional().isObject(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, type, description, systemPrompt, configuration } = req.body;

      // Check if agent name already exists for this user
      const existingAgent = await prisma.agent.findFirst({
        where: {
          name,
          userId: req.user!.id
        }
      });

      if (existingAgent) {
        return res.status(409).json({ error: 'Agent with this name already exists' });
      }

      // Create default system prompt based on agent type if none provided
      const defaultSystemPrompt = systemPrompt || getDefaultSystemPrompt(type as any);

      const agent = await prisma.agent.create({
        data: {
          name,
          type: type as string,
          description,
          systemPrompt: defaultSystemPrompt,
          configuration: JSON.stringify(configuration || getDefaultConfiguration(type as any)),
          userId: req.user!.id,
          status: 'STOPPED',
        }
      });

      res.status(201).json(agent);
    } catch (error) {
      console.error('Create agent error:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  }
);

// GET /api/agents/:id - Get a specific agent
router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        },
        include: {
          projectAgents: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  status: true
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              createdAt: true,
              _count: {
                select: {
                  messages: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          },
          storyAssignments: {
            include: {
              story: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  priority: true
                }
              }
            }
          }
        }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json(agent);
    } catch (error) {
      console.error('Get agent error:', error);
      res.status(500).json({ error: 'Failed to fetch agent' });
    }
  }
);

// PUT /api/agents/:id - Update an agent
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('systemPrompt').optional().isLength({ max: 2000 }),
    body('configuration').optional().isObject(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, systemPrompt, configuration } = req.body;

      // Check if agent exists and belongs to user
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!existingAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check name uniqueness if name is being updated
      if (name && name !== existingAgent.name) {
        const nameExists = await prisma.agent.findFirst({
          where: {
            name,
            userId: req.user!.id,
            id: { not: req.params.id }
          }
        });

        if (nameExists) {
          return res.status(409).json({ error: 'Agent with this name already exists' });
        }
      }

      const updatedAgent = await prisma.agent.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(systemPrompt && { systemPrompt }),
          ...(configuration && { configuration: JSON.stringify(configuration) }),
          updatedAt: new Date()
        }
      });

      res.json(updatedAgent);
    } catch (error) {
      console.error('Update agent error:', error);
      res.status(500).json({ error: 'Failed to update agent' });
    }
  }
);

// POST /api/agents/:id/start - Start an agent
router.post('/:id/start',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const updatedAgent = await prisma.agent.update({
        where: { id: req.params.id },
        data: {
          status: 'ACTIVE',
          lastActivity: new Date()
        }
      });

      res.json({ message: 'Agent started successfully', agent: updatedAgent });
    } catch (error) {
      console.error('Start agent error:', error);
      res.status(500).json({ error: 'Failed to start agent' });
    }
  }
);

// POST /api/agents/:id/stop - Stop an agent
router.post('/:id/stop',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const updatedAgent = await prisma.agent.update({
        where: { id: req.params.id },
        data: {
          status: 'STOPPED'
        }
      });

      res.json({ message: 'Agent stopped successfully', agent: updatedAgent });
    } catch (error) {
      console.error('Stop agent error:', error);
      res.status(500).json({ error: 'Failed to stop agent' });
    }
  }
);

// POST /api/agents/:id/chat - Send a message to an agent
router.post('/:id/chat',
  [
    param('id').isUUID(),
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
    body('conversationId').optional().isUUID(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { message, conversationId } = req.body;

      const agent = await prisma.agent.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Create or get conversation
      let conversation;
      if (conversationId) {
        conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            agentId: agent.id
          }
        });
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
      } else {
        conversation = await prisma.conversation.create({
          data: {
            agentId: agent.id
          }
        });
      }

      // Save user message
      await prisma.message.create({
        data: {
          content: message,
          role: 'USER',
          conversationId: conversation.id
        }
      });

      // Get agent response from AI service
      const response = await aiService.generateResponse(agent, message, conversation.id);

      // Save agent response
      await prisma.message.create({
        data: {
          content: response,
          role: 'AGENT',
          conversationId: conversation.id
        }
      });

      // Update agent last activity
      await prisma.agent.update({
        where: { id: agent.id },
        data: { lastActivity: new Date() }
      });

      res.json({
        conversationId: conversation.id,
        message: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Agent chat error:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
);

// GET /api/agents/:id/conversations - Get agent conversations
router.get('/:id/conversations',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const conversations = await prisma.conversation.findMany({
        where: { agentId: agent.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }
);

// DELETE /api/agents/:id - Delete an agent
router.delete('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await prisma.agent.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      await prisma.agent.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
      console.error('Delete agent error:', error);
      res.status(500).json({ error: 'Failed to delete agent' });
    }
  }
);

// Helper functions
function getDefaultSystemPrompt(type: AgentType): string {
  const prompts = {
    ANALYST: `You are a Requirements Analyst AI agent specializing in gathering, analyzing, and documenting software requirements. Your role is to:

1. Elicit detailed requirements from stakeholders
2. Analyze business needs and translate them into technical specifications
3. Create user stories, acceptance criteria, and functional requirements
4. Identify potential risks, dependencies, and constraints
5. Ensure requirements are clear, testable, and feasible

Always ask clarifying questions and provide detailed analysis with actionable recommendations.`,

    PM: `You are a Product Manager AI agent focused on product strategy, roadmap planning, and stakeholder management. Your responsibilities include:

1. Define product vision and strategy
2. Prioritize features and manage the product backlog
3. Coordinate between development teams and stakeholders
4. Track project progress and deliverables
5. Make data-driven decisions about product direction

Provide strategic insights and facilitate effective product development workflows.`,

    ARCHITECT: `You are a System Architect AI agent specialized in designing scalable, maintainable software systems. Your expertise covers:

1. Design system architecture and technical specifications
2. Make technology stack recommendations
3. Define integration patterns and data flows
4. Ensure security, performance, and scalability considerations
5. Create architectural documentation and diagrams

Focus on creating robust, future-proof solutions that align with business requirements.`,

    SCRUM_MASTER: `You are a Scrum Master AI agent dedicated to facilitating agile development processes. Your role encompasses:

1. Break down epics into user stories and tasks
2. Facilitate sprint planning and retrospectives
3. Remove blockers and improve team velocity
4. Ensure adherence to agile principles and practices
5. Coach teams on continuous improvement

Help teams deliver value efficiently while maintaining high-quality standards.`,

    DEVELOPER: `You are a Developer AI agent focused on writing high-quality, maintainable code. Your capabilities include:

1. Implement features according to specifications
2. Write clean, well-documented code
3. Conduct code reviews and suggest improvements
4. Debug issues and optimize performance
5. Follow best practices and coding standards

Provide technical solutions that are robust, efficient, and aligned with project requirements.`,

    TESTER: `You are a Quality Assurance Tester AI agent specializing in ensuring software quality. Your responsibilities include:

1. Design and execute comprehensive test plans
2. Create automated and manual test cases
3. Identify bugs and verify fixes
4. Perform regression, integration, and performance testing
5. Ensure requirements traceability and coverage

Focus on delivering high-quality software that meets user expectations and requirements.`,

    DESIGNER: `You are a UX/UI Designer AI agent focused on creating intuitive, user-centered designs. Your expertise covers:

1. Design user interfaces and experiences
2. Create wireframes, mockups, and prototypes
3. Conduct user research and usability testing
4. Ensure accessibility and responsive design
5. Collaborate with development teams on implementation

Create designs that are both aesthetically pleasing and functionally effective.`,

    DEVOPS: `You are a DevOps Engineer AI agent specializing in automation, deployment, and infrastructure management. Your focus areas include:

1. Design and maintain CI/CD pipelines
2. Manage cloud infrastructure and deployments
3. Implement monitoring and logging solutions
4. Automate repetitive tasks and processes
5. Ensure security, scalability, and reliability

Help teams achieve faster, more reliable software delivery through automation and best practices.`
  };

  return prompts[type] || prompts.DEVELOPER;
}

function getDefaultConfiguration(type: AgentType) {
  return {
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gpt-4',
    timeout: 30000,
    retries: 3
  };
}

export default router;