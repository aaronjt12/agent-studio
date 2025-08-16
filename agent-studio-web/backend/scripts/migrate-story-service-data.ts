import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateStoryServiceData() {
  try {
    console.log('🔄 Migrating Story Manager data to backend database...\n');

    // Get the existing user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No user found in database');
      return;
    }

    // Get the Auth0 project
    let auth0Project = await prisma.project.findFirst({
      where: {
        name: 'Auth0 Authentication',
        userId: user.id
      }
    });

    if (!auth0Project) {
      console.error('❌ Auth0 Authentication project not found');
      return;
    }

    console.log('📋 Found Auth0 project:', auth0Project.id);

    // Clear existing stories from the Auth0 project to avoid duplicates
    await prisma.story.deleteMany({
      where: { projectId: auth0Project.id }
    });

    console.log('🧹 Cleared existing Auth0 project stories');

    // Define the original Story Manager stories (from storyService)
    const storyManagerStories = [
      {
        title: 'User Authentication System',
        description: 'Implement JWT-based authentication with role management',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        storyPoints: 8
      },
      {
        title: 'API Gateway Implementation',
        description: 'Create centralized API gateway with rate limiting and logging',
        priority: 'MEDIUM',
        status: 'BACKLOG',
        storyPoints: 5
      },
      {
        title: 'Database Migration Tool',
        description: 'Build tool for seamless database schema migrations',
        priority: 'LOW',
        status: 'DONE',
        storyPoints: 3
      }
    ];

    // Add a few more realistic auth stories to make a good set
    const additionalAuthStories = [
      {
        title: 'Role-Based Access Control',
        description: 'Create middleware and guards for role-based access control with Admin, User, and Guest roles',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        storyPoints: 5
      },
      {
        title: 'User Profile Management',
        description: 'Build user profile pages with edit capabilities, avatar upload, and account settings',
        priority: 'MEDIUM',
        status: 'BACKLOG',
        storyPoints: 3
      },
      {
        title: 'Password Reset Flow',
        description: 'Implement secure password reset functionality with email verification and token expiration',
        priority: 'MEDIUM',
        status: 'BACKLOG',
        storyPoints: 5
      },
      {
        title: 'Session Management',
        description: 'Handle user sessions, token refresh, and automatic logout on token expiration',
        priority: 'HIGH',
        status: 'DONE',
        storyPoints: 3
      },
      {
        title: 'API Security Middleware',
        description: 'Create authentication middleware for API endpoints with proper error handling',
        priority: 'HIGH',
        status: 'DONE',
        storyPoints: 4
      }
    ];

    const allStories = [...storyManagerStories, ...additionalAuthStories];

    // Create stories in the database
    console.log(`📝 Creating ${allStories.length} stories...`);
    
    for (const storyData of allStories) {
      const story = await prisma.story.create({
        data: {
          ...storyData,
          projectId: auth0Project.id
        }
      });
      console.log(`✅ Created: ${story.title} (${story.status}) [${story.storyPoints} pts]`);
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

      console.log('\n📊 Final Project Statistics:');
      console.log(`   Project: ${finalProject.name}`);
      console.log(`   Total Stories: ${finalProject._count.stories}`);
      console.log(`   Stories by Status:`, storiesByStatus);
      console.log(`   Total Story Points: ${totalStoryPoints}`);
      console.log(`   Completed Story Points: ${completedStoryPoints}`);
      console.log(`   Overall Progress: ${progressPercentage}%`);
    }

    console.log('\n🎉 Successfully migrated Story Manager data to backend database!');
    console.log('💡 Next: Update Story Manager to use backend API instead of storyService');

  } catch (error) {
    console.error('❌ Error migrating data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateStoryServiceData()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrateStoryServiceData;