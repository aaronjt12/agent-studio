import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../server';
import { AuthenticatedRequest } from '../middleware/auth';
// Use string enums (stored as strings)
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

// GET /api/stories - List stories (optionally filtered by project)
router.get('/',
  [
    query('projectId').optional().isUUID(),
    query('status').optional().isIn(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'DONE', 'BLOCKED']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    query('assignedAgentId').optional().isUUID(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId, status, priority, assignedAgentId } = req.query;
      
      const whereClause: any = {
        project: {
          userId: req.user!.id
        }
      };

      if (projectId) whereClause.projectId = projectId;
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      
      if (assignedAgentId) {
        whereClause.agents = {
          some: {
            agentId: assignedAgentId as string
          }
        };
      }

      const stories = await prisma.story.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          agents: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true
                }
              }
            }
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          _count: {
            select: {
              tasks: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      const storiesWithStats = stories.map(story => ({
        ...story,
        assignedAgents: story.agents.map(sa => sa.agent),
        stats: {
          totalTasks: story._count.tasks,
          completedTasks: story.tasks.filter(task => task.status === 'DONE').length
        }
      }));

      res.json(storiesWithStats);
    } catch (error) {
      console.error('Get stories error:', error);
      res.status(500).json({ error: 'Failed to fetch stories' });
    }
  }
);

// POST /api/stories - Create a new story
router.post('/',
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description must be 1-2000 characters'),
    body('projectId').isUUID().withMessage('Valid project ID is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('storyPoints').optional().isInt({ min: 1, max: 21 }).withMessage('Story points must be 1-21'),
    body('status').optional().isIn(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'DONE', 'BLOCKED']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, projectId, priority, storyPoints, status } = req.body;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: req.user!.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const story = await prisma.story.create({
        data: {
          title,
          description,
          projectId,
          priority: (priority as string) || 'MEDIUM',
          storyPoints,
          status: (status as string) || 'BACKLOG'
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          agents: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true
                }
              }
            }
          },
          tasks: true
        }
      });

      res.status(201).json({
        ...story,
        assignedAgents: story.agents.map(sa => sa.agent),
        stats: {
          totalTasks: 0,
          completedTasks: 0
        }
      });
    } catch (error) {
      console.error('Create story error:', error);
      res.status(500).json({ error: 'Failed to create story' });
    }
  }
);

// POST /api/stories/generate - Generate story from requirements using AI
router.post('/generate',
  [
    body('requirements').trim().isLength({ min: 10, max: 2000 }).withMessage('Requirements must be 10-2000 characters'),
    body('projectId').isUUID().withMessage('Valid project ID is required'),
    body('agentId').optional().isUUID().withMessage('Agent ID must be valid UUID if provided'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { requirements, projectId, agentId } = req.body;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: req.user!.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Find or use default agent for story generation
      let targetAgentId = agentId;
      if (!targetAgentId) {
        // Look for an analyst or PM agent in the project
        const projectAgent = await prisma.projectAgent.findFirst({
          where: {
            projectId,
            agent: {
              type: { in: ['ANALYST', 'PM'] }
            }
          },
          include: {
            agent: true
          }
        });

        if (projectAgent) {
          targetAgentId = projectAgent.agentId;
        } else {
          // Create a temporary analyst agent for story generation
          const tempAgent = await prisma.agent.create({
            data: {
              name: `Story Generator for ${project.name}`,
              type: 'ANALYST',
              description: 'AI agent specialized in generating user stories from requirements',
              userId: req.user!.id,
              status: 'ACTIVE'
            }
          });
          targetAgentId = tempAgent.id;
        }
      }

      // Generate story using AI
      const generatedStory = await aiService.generateStoryFromRequirements(requirements, targetAgentId);

      // Create the story in database
      const story = await prisma.story.create({
        data: {
          title: generatedStory.title,
          description: generatedStory.description,
          projectId,
          priority: 'MEDIUM',
          storyPoints: generatedStory.storyPoints,
          status: 'BACKLOG'
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Create tasks from acceptance criteria
      if (generatedStory.acceptanceCriteria && generatedStory.acceptanceCriteria.length > 0) {
        const tasks = await Promise.all(
          generatedStory.acceptanceCriteria.map((criteria, index) =>
            prisma.task.create({
              data: {
                title: `Acceptance Criteria ${index + 1}`,
                description: criteria,
                storyId: story.id,
                 status: 'TODO'
              }
            })
          )
        );
      }

      res.status(201).json({
        message: 'Story generated successfully',
        story,
        generationDetails: {
          acceptanceCriteria: generatedStory.acceptanceCriteria,
          estimatedPoints: generatedStory.storyPoints,
          agentUsed: targetAgentId
        }
      });
    } catch (error) {
      console.error('Generate story error:', error);
      res.status(500).json({ error: 'Failed to generate story' });
    }
  }
);

// GET /api/stories/:id - Get a specific story
router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const story = await prisma.story.findFirst({
        where: {
          id: req.params.id,
          project: {
            userId: req.user!.id
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          agents: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true,
                  description: true
                }
              }
            }
          },
          tasks: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      res.json({
        ...story,
        assignedAgents: story.agents.map(sa => sa.agent),
        stats: {
          totalTasks: story.tasks.length,
          completedTasks: story.tasks.filter(task => task.status === 'DONE').length,
          tasksInProgress: story.tasks.filter(task => task.status === 'IN_PROGRESS').length
        }
      });
    } catch (error) {
      console.error('Get story error:', error);
      res.status(500).json({ error: 'Failed to fetch story' });
    }
  }
);

// PUT /api/stories/:id - Update a story
router.put('/:id',
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('storyPoints').optional().isInt({ min: 1, max: 21 }),
    body('status').optional().isIn(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'DONE', 'BLOCKED']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { title, description, priority, storyPoints, status } = req.body;

      // Check if story exists and belongs to user's project
      const existingStory = await prisma.story.findFirst({
        where: {
          id: req.params.id,
          project: {
            userId: req.user!.id
          }
        }
      });

      if (!existingStory) {
        return res.status(404).json({ error: 'Story not found' });
      }

      const updatedStory = await prisma.story.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(priority && { priority: priority as string }),
          ...(storyPoints && { storyPoints }),
          ...(status && { status: status as string }),
          updatedAt: new Date()
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          agents: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true
                }
              }
            }
          },
          tasks: true
        }
      });

      res.json({
        ...updatedStory,
        assignedAgents: updatedStory.agents.map(sa => sa.agent),
        stats: {
          totalTasks: updatedStory.tasks.length,
          completedTasks: updatedStory.tasks.filter(task => task.status === 'DONE').length
        }
      });
    } catch (error) {
      console.error('Update story error:', error);
      res.status(500).json({ error: 'Failed to update story' });
    }
  }
);

// POST /api/stories/:id/agents - Assign an agent to a story
router.post('/:id/agents',
  [
    param('id').isUUID(),
    body('agentId').isUUID().withMessage('Valid agent ID is required'),
    body('role').optional().trim().isLength({ max: 100 }),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { agentId, role } = req.body;

      // Check if story exists and belongs to user's project
      const story = await prisma.story.findFirst({
        where: {
          id: req.params.id,
          project: {
            userId: req.user!.id
          }
        }
      });

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId: req.user!.id
        }
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check if agent is already assigned to story
      const existingAssignment = await prisma.storyAgent.findFirst({
        where: {
          storyId: req.params.id,
          agentId
        }
      });

      if (existingAssignment) {
        return res.status(409).json({ error: 'Agent is already assigned to this story' });
      }

      const storyAgent = await prisma.storyAgent.create({
        data: {
          storyId: req.params.id,
          agentId,
          role: role || agent.type
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true
            }
          }
        }
      });

      res.status(201).json({
        message: 'Agent assigned to story successfully',
        assignment: storyAgent
      });
    } catch (error) {
      console.error('Assign agent to story error:', error);
      res.status(500).json({ error: 'Failed to assign agent to story' });
    }
  }
);

// DELETE /api/stories/:id/agents/:agentId - Remove agent from story
router.delete('/:id/agents/:agentId',
  [
    param('id').isUUID(),
    param('agentId').isUUID(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Check if assignment exists and story belongs to user
      const assignment = await prisma.storyAgent.findFirst({
        where: {
          storyId: req.params.id,
          agentId: req.params.agentId,
          story: {
            project: {
              userId: req.user!.id
            }
          }
        }
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Agent assignment not found' });
      }

      await prisma.storyAgent.delete({
        where: { id: assignment.id }
      });

      res.json({ message: 'Agent removed from story successfully' });
    } catch (error) {
      console.error('Remove agent from story error:', error);
      res.status(500).json({ error: 'Failed to remove agent from story' });
    }
  }
);

// DELETE /api/stories/:id - Delete a story
router.delete('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const story = await prisma.story.findFirst({
        where: {
          id: req.params.id,
          project: {
            userId: req.user!.id
          }
        }
      });

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      await prisma.story.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Story deleted successfully' });
    } catch (error) {
      console.error('Delete story error:', error);
      res.status(500).json({ error: 'Failed to delete story' });
    }
  }
);

export default router;