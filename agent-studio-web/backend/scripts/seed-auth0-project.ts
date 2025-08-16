import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Seeding Auth0 Authentication project...');

    // First, let's find an existing user or create one
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No users found, creating a test user...');
      user = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          username: 'admin',
          password: 'password', // In real app, this would be hashed
          name: 'Admin User',
          role: 'ADMIN'
        }
      });
      console.log('✅ Created test user:', user.email);
    } else {
      console.log('📋 Using existing user:', user.email);
    }

    // Check if Auth0 project already exists
    let auth0Project = await prisma.project.findFirst({
      where: {
        name: 'Auth0 Authentication',
        userId: user.id
      }
    });

    if (auth0Project) {
      console.log('📋 Auth0 Authentication project already exists:', auth0Project.id);
    } else {
      // Create the Auth0 Authentication project
      auth0Project = await prisma.project.create({
        data: {
          name: 'Auth0 Authentication',
          description: 'Implementation of Auth0 authentication system with JWT-based user management, role-based access control, and secure session handling.',
          status: 'IN_PROGRESS',
          userId: user.id
        }
      });
      console.log('✅ Created Auth0 Authentication project:', auth0Project.id);
    }

    // Get all existing stories to see what we have
    const allStories = await prisma.story.findMany({
      include: {
        project: true
      }
    });
    
    const orphanedStories = allStories.filter(story => !story.project);

    console.log(`📝 Found ${orphanedStories.length} orphaned stories`);

    // If there are no orphaned stories, create some sample auth-related stories
    if (orphanedStories.length === 0) {
      console.log('Creating sample authentication stories...');
      
      const sampleStories = [
        {
          title: 'User Authentication System',
          description: 'Implement JWT-based authentication with Auth0 integration including login, logout, and token management',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          storyPoints: 8
        },
        {
          title: 'Role-Based Access Control',
          description: 'Create middleware and guards for role-based access control with Admin, User, and Guest roles',
          status: 'IN_PROGRESS', 
          priority: 'HIGH',
          storyPoints: 5
        },
        {
          title: 'User Profile Management',
          description: 'Build user profile pages with edit capabilities, avatar upload, and account settings',
          status: 'BACKLOG',
          priority: 'MEDIUM',
          storyPoints: 3
        },
        {
          title: 'Password Reset Flow',
          description: 'Implement secure password reset functionality with email verification and token expiration',
          status: 'BACKLOG',
          priority: 'MEDIUM',
          storyPoints: 5
        },
        {
          title: 'Session Management',
          description: 'Handle user sessions, token refresh, and automatic logout on token expiration',
          status: 'DONE',
          priority: 'HIGH',
          storyPoints: 3
        },
        {
          title: 'API Security Middleware',
          description: 'Create authentication middleware for API endpoints with proper error handling',
          status: 'DONE',
          priority: 'HIGH',
          storyPoints: 4
        }
      ];

      for (const storyData of sampleStories) {
        const story = await prisma.story.create({
          data: {
            ...storyData,
            projectId: auth0Project.id
          }
        });
        console.log(`✅ Created story: ${story.title} (${story.status})`);
      }
    } else {
      // Link existing orphaned stories to the Auth0 project
      for (const story of orphanedStories) {
        await prisma.story.update({
          where: { id: story.id },
          data: { projectId: auth0Project.id }
        });
      }

      console.log(`✅ Linked ${orphanedStories.length} existing stories to Auth0 project`);
    }

    // Get final project stats
    const finalProject = await prisma.project.findUnique({
      where: { id: auth0Project.id },
      include: {
        stories: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            storyPoints: true
          }
        },
        _count: {
          select: {
            stories: true
          }
        }
      }
    });

    if (finalProject) {
      const storiesByStatus = finalProject.stories.reduce((acc: any, story) => {
        acc[story.status] = (acc[story.status] || 0) + 1;
        return acc;
      }, {});

      const totalStoryPoints = finalProject.stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      const completedStoryPoints = finalProject.stories
        .filter(story => story.status === 'DONE')
        .reduce((sum, story) => sum + (story.storyPoints || 0), 0);
      
      const progressPercentage = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

      console.log('\n📊 Project Statistics:');
      console.log(`   Total Stories: ${finalProject._count.stories}`);
      console.log(`   Stories by Status:`, storiesByStatus);
      console.log(`   Total Story Points: ${totalStoryPoints}`);
      console.log(`   Completed Story Points: ${completedStoryPoints}`);
      console.log(`   Overall Progress: ${progressPercentage}%`);
    }

    console.log('\n🎉 Successfully seeded Auth0 Authentication project!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;