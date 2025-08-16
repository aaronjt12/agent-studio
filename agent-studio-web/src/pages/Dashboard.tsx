import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Architecture as ArchitectureIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  BugReport as BugReportIcon,
  DesignServices as DesignIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import { useAgents } from '../hooks/useAgents';
import { useStories } from '../hooks/useStories';
import { useNavigate } from 'react-router-dom';
import { AGENT_STUDIO_AGENTS, AgentStudioAgent } from '../config/agentAgents';


const agentIcons = {
  ANALYST: PsychologyIcon,
  PM: BusinessIcon,
  ARCHITECT: ArchitectureIcon,
  SCRUM_MASTER: SpeedIcon,
  DEVELOPER: CodeIcon,
  TESTER: BugReportIcon,
  DESIGNER: DesignIcon,
  DEVOPS: CloudIcon,
};

const agentColors = {
  ANALYST: 'primary.main',
  PM: 'secondary.main',
  ARCHITECT: 'info.main',
  SCRUM_MASTER: 'warning.main',
  DEVELOPER: 'success.main',
  TESTER: 'error.main',
  DESIGNER: 'purple',
  DEVOPS: 'orange',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: projects, isLoading: projectsLoading } = useProjects({ status: 'IN_PROGRESS' });
  const { data: agents, isLoading: agentsLoading } = useAgents({ status: 'ACTIVE' });
  const { data: stories, isLoading: storiesLoading } = useStories();

  const activeProjects = projects?.filter(p => p.status === 'IN_PROGRESS') || [];
  
  const recentStories = stories?.slice(0, 5) || [];
  const totalStories = stories?.length || 0;

  const getStoryProgress = (story: any) => {
    if (story.stats?.totalTasks === 0) return 0;
    return Math.round((story.stats?.completedTasks / story.stats?.totalTasks) * 100);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Agent Studio
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Your AI-driven development framework for collaborative planning and context-engineered development
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Start
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Get started with BMad Method in minutes. Follow these steps to begin your AI-driven development journey.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  startIcon={<SmartToyIcon />}
                  onClick={() => navigate('/agents')}
                >
                  Configure Agents
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<DescriptionIcon />}
                  onClick={() => navigate('/stories')}
                >
                  Create First Story
                </Button>
                <Button variant="outlined">
                  View Documentation
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Active Projects</Typography>
                  </Box>
                  {projectsLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <>
                      <Typography variant="h3" component="div">
                        {activeProjects.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Currently in development
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SpeedIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Stories Created</Typography>
                  </Box>
                  {storiesLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <>
                      <Typography variant="h3" component="div">
                        {totalStories}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total stories
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Agents
              </Typography>
              {agentsLoading ? (
                <CircularProgress size={24} />
              ) : agents && agents.length > 0 ? (
                <List dense>
                  {agents.slice(0, 5).map((agent) => {
                    const IconComponent = agentIcons[agent.type] || SmartToyIcon;
                    const chipColor = agent.status === 'ACTIVE' ? 'success' : 
                                     agent.status === 'IDLE' ? 'warning' : 'default';
                    
                    return (
                      <ListItem key={agent.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: agentColors[agent.type] || 'grey.500' }}>
                            <IconComponent />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={agent.name}
                          secondary={agent.description || agent.type.toLowerCase().replace('_', ' ')}
                        />
                        <Chip 
                          label={agent.status.toLowerCase()} 
                          size="small" 
                          color={chipColor} 
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No agents configured yet. Create your first agent to get started!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Studio Team Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your AI development team consists of specialized agents, each with unique capabilities and roles.
              </Typography>
              <Grid container spacing={2}>
                {AGENT_STUDIO_AGENTS.map((agent: AgentStudioAgent) => (
                  <Grid item xs={12} sm={6} md={3} key={agent.id}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'grey.50' }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {agent.icon}
                      </Typography>
                      <Typography variant="subtitle1" gutterBottom>
                        {agent.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {agent.type.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontSize: '0.8rem' }}>
                        {agent.description.split(' - ')[1]}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/workflows')}
                  startIcon={<TrendingUpIcon />}
                >
                  View Agent Studio Workflows
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Stories
            </Typography>
            {storiesLoading ? (
              <CircularProgress size={24} />
            ) : recentStories.length > 0 ? (
              recentStories.map((story) => {
                const progress = getStoryProgress(story);
                return (
                  <Box key={story.id} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {story.title} - {progress}% Complete
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      sx={{ mt: 1 }} 
                    />
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary">
                No stories created yet. Create your first story to see progress here!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}