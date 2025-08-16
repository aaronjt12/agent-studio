import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking database contents...\n');

    // Check projects
    const projects = await prisma.project.findMany({
      include: {
        stories: {
          select: {
            id: true,
            title: true,
            status: true,
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

    console.log(`📁 Found ${projects.length} project(s):`);
    projects.forEach(project => {
      const completedStories = project.stories.filter(s => s.status === 'DONE').length;
      const totalStoryPoints = project.stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
      const completedStoryPoints = project.stories
        .filter(s => s.status === 'DONE')
        .reduce((sum, s) => sum + (s.storyPoints || 0), 0);
      const progressPercentage = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

      console.log(`\n  🚀 ${project.name}`);
      console.log(`     Status: ${project.status}`);
      console.log(`     Description: ${project.description}`);
      console.log(`     Stories: ${completedStories}/${project._count.stories} completed (${progressPercentage}% progress)`);
      console.log(`     Story Points: ${completedStoryPoints}/${totalStoryPoints}`);
      
      if (project.stories.length > 0) {
        console.log('     📝 Stories:');
        project.stories.forEach(story => {
          console.log(`        - ${story.title} (${story.status}) [${story.storyPoints || 0} pts]`);
        });
      }
    });

    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log(`\n👥 Found ${users.length} user(s):`);
    users.forEach(user => {
      console.log(`   - ${user.name || user.email} (${user.id})`);
    });

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkData()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default checkData;