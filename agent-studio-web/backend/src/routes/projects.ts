import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../server';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

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

// GET /api/projects - List all projects for the authenticated user
router.get('/',
  [
    query('status').optional().isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
    query('search').optional().isString(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { status, search } = req.query;
      
      const whereClause: any = {
        userId: req.user!.id,
      };

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              stories: true,
              agents: true
            }
          },
          stories: {
            select: {
              id: true,
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
                  status: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const projectsWithStats = projects.map(project => ({
        ...project,
        stats: {
          totalStories: project._count.stories,
          completedStories: project.stories.filter(s => s.status === 'DONE').length,
          totalAgents: project._count.agents,
          activeAgents: project.agents.filter(pa => pa.agent.status === 'ACTIVE').length
        },
        agents: project.agents.map(pa => pa.agent)
      }));

      res.json(projectsWithStats);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }
);

// POST /api/projects - Create a new project
router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name must be 1-100 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('status').optional().isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, status } = req.body;

      // Check if project name already exists for this user
      const existingProject = await prisma.project.findFirst({
        where: {
          name,
          userId: req.user!.id
        }
      });

      if (existingProject) {
        return res.status(409).json({ error: 'Project with this name already exists' });
      }

      const project = await prisma.project.create({
        data: {
          name,
          description,
          status: (status as string) || 'PLANNING',
          userId: req.user!.id,
        },
        include: {
          _count: {
            select: {
              stories: true,
              agents: true
            }
          }
        }
      });

      res.status(201).json({
        ...project,
        stats: {
          totalStories: 0,
          completedStories: 0,
          totalAgents: 0,
          activeAgents: 0
        },
        agents: []
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// GET /api/projects/:id - Get a specific project
router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        },
        include: {
          stories: {
            include: {
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
              }
            },
            orderBy: {
              createdAt: 'desc'
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
                  description: true,
                  lastActivity: true
                }
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const projectWithStats = {
        ...project,
        stats: {
          totalStories: project.stories.length,
          completedStories: project.stories.filter(s => s.status === 'DONE').length,
          totalAgents: project.agents.length,
          activeAgents: project.agents.filter(pa => pa.agent.status === 'ACTIVE').length,
          storiesByStatus: project.stories.reduce((acc: any, story) => {
            acc[story.status] = (acc[story.status] || 0) + 1;
            return acc;
          }, {}),
          totalTasks: project.stories.reduce((sum, story) => sum + story.tasks.length, 0),
          completedTasks: project.stories.reduce((sum, story) => 
            sum + story.tasks.filter(task => task.status === 'DONE').length, 0
          )
        },
        agents: project.agents.map(pa => pa.agent)
      };

      res.json(projectWithStats);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  }
);

// PUT /api/projects/:id - Update a project
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isLength({ max: 1000 }),
    body('status').optional().isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, status } = req.body;

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check name uniqueness if name is being updated
      if (name && name !== existingProject.name) {
        const nameExists = await prisma.project.findFirst({
          where: {
            name,
            userId: req.user!.id,
            id: { not: req.params.id }
          }
        });

        if (nameExists) {
          return res.status(409).json({ error: 'Project with this name already exists' });
        }
      }

      const updatedProject = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status: status as string }),
          updatedAt: new Date()
        },
        include: {
          _count: {
            select: {
              stories: true,
              agents: true
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
          }
        }
      });

      res.json({
        ...updatedProject,
        stats: {
          totalStories: updatedProject._count.stories,
          completedStories: 0, // Would need additional query for this
          totalAgents: updatedProject._count.agents,
          activeAgents: updatedProject.agents.filter(pa => pa.agent.status === 'ACTIVE').length
        },
        agents: updatedProject.agents.map(pa => pa.agent)
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// POST /api/projects/:id/agents - Add an agent to a project
router.post('/:id/agents',
  [
    param('id').isUUID(),
    body('agentId').isUUID().withMessage('Valid agent ID is required'),
    body('role').optional().trim().isLength({ max: 100 }).withMessage('Role must be less than 100 characters'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { agentId, role } = req.body;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
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

      // Check if agent is already assigned to project
      const existingAssignment = await prisma.projectAgent.findFirst({
        where: {
          projectId: req.params.id,
          agentId
        }
      });

      if (existingAssignment) {
        return res.status(409).json({ error: 'Agent is already assigned to this project' });
      }

      const projectAgent = await prisma.projectAgent.create({
        data: {
          projectId: req.params.id,
          agentId,
          role
        },
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
      });

      res.status(201).json({
        message: 'Agent added to project successfully',
        assignment: projectAgent
      });
    } catch (error) {
      console.error('Add agent to project error:', error);
      res.status(500).json({ error: 'Failed to add agent to project' });
    }
  }
);

// DELETE /api/projects/:id/agents/:agentId - Remove an agent from a project
router.delete('/:id/agents/:agentId',
  [
    param('id').isUUID(),
    param('agentId').isUUID(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if assignment exists
      const assignment = await prisma.projectAgent.findFirst({
        where: {
          projectId: req.params.id,
          agentId: req.params.agentId
        }
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Agent assignment not found' });
      }

      await prisma.projectAgent.delete({
        where: { id: assignment.id }
      });

      res.json({ message: 'Agent removed from project successfully' });
    } catch (error) {
      console.error('Remove agent from project error:', error);
      res.status(500).json({ error: 'Failed to remove agent from project' });
    }
  }
);

// GET /api/projects/:id/dashboard - Get project dashboard data
router.get('/:id/dashboard',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        },
        include: {
          stories: {
            include: {
              tasks: true,
              agents: {
                include: {
                  agent: {
                    select: {
                      name: true,
                      type: true
                    }
                  }
                }
              }
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
                  lastActivity: true
                }
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Calculate comprehensive statistics
      const stats = {
        stories: {
          total: project.stories.length,
          byStatus: project.stories.reduce((acc: any, story) => {
            acc[story.status] = (acc[story.status] || 0) + 1;
            return acc;
          }, {}),
          byPriority: project.stories.reduce((acc: any, story) => {
            acc[story.priority] = (acc[story.priority] || 0) + 1;
            return acc;
          }, {}),
          totalStoryPoints: project.stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0),
          completedStoryPoints: project.stories
            .filter(story => story.status === 'DONE')
            .reduce((sum, story) => sum + (story.storyPoints || 0), 0)
        },
        tasks: {
          total: project.stories.reduce((sum, story) => sum + story.tasks.length, 0),
          byStatus: project.stories.reduce((acc: any, story) => {
            story.tasks.forEach(task => {
              acc[task.status] = (acc[task.status] || 0) + 1;
            });
            return acc;
          }, {})
        },
        agents: {
          total: project.agents.length,
          byStatus: project.agents.reduce((acc: any, pa) => {
            acc[pa.agent.status] = (acc[pa.agent.status] || 0) + 1;
            return acc;
          }, {}),
          byType: project.agents.reduce((acc: any, pa) => {
            acc[pa.agent.type] = (acc[pa.agent.type] || 0) + 1;
            return acc;
          }, {}),
          recentActivity: project.agents
            .filter(pa => pa.agent.lastActivity)
            .sort((a, b) => new Date(b.agent.lastActivity!).getTime() - new Date(a.agent.lastActivity!).getTime())
            .slice(0, 5)
            .map(pa => ({
              id: pa.agent.id,
              name: pa.agent.name,
              type: pa.agent.type,
              lastActivity: pa.agent.lastActivity
            }))
        }
      };

      res.json({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        },
        stats,
        recentStories: project.stories
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map(story => ({
            id: story.id,
            title: story.title,
            status: story.status,
            priority: story.priority,
            storyPoints: story.storyPoints,
            updatedAt: story.updatedAt,
            assignedAgents: story.agents.map(sa => sa.agent.name)
          }))
      });
    } catch (error) {
      console.error('Get project dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch project dashboard' });
    }
  }
);

// DELETE /api/projects/:id - Delete a project
router.delete('/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res) => {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await prisma.project.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
);

export default router;