import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useStories } from '../hooks/useStories';
import { useProjects } from '../hooks/useProjects';
import type { Story } from '../services/api';

export default function StoryManager() {
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: allStoriesData, isLoading: storiesLoading } = useStories({ projectId: selectedProjectId || undefined });
  const [stories, setStories] = useState<Story[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [open, setOpen] = useState(false);

  // Auto-select Auth0 project on load
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      const auth0Project = projects.find(p => p.name === 'Auth0 Authentication');
      if (auth0Project) {
        setSelectedProjectId(auth0Project.id);
      } else {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [projects, selectedProjectId]);

  // Load stories from backend API
  useEffect(() => {
    if (allStoriesData) {
      setStories(allStoriesData);
    }
  }, [allStoriesData]);

  const getStatusColor = (status: Story['status']) => {
    switch (status) {
      case 'BACKLOG': return 'default';
      case 'READY': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'IN_REVIEW': return 'secondary';
      case 'TESTING': return 'info';
      case 'DONE': return 'success';
      case 'BLOCKED': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Story['priority']) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Story['status']) => {
    switch (status) {
      case 'BACKLOG': return <ScheduleIcon />;
      case 'READY': return <ScheduleIcon />;
      case 'IN_PROGRESS': return <PlayArrowIcon />;
      case 'IN_REVIEW': return <PauseIcon />;
      case 'TESTING': return <PauseIcon />;
      case 'DONE': return <CheckCircleIcon />;
      case 'BLOCKED': return <PauseIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const filteredStories = () => {
    switch (tabValue) {
      case 0: return stories;
      case 1: return stories.filter(s => s.status === 'IN_PROGRESS');
      case 2: return stories.filter(s => s.status === 'READY' || s.status === 'BACKLOG');
      case 3: return stories.filter(s => s.status === 'DONE');
      default: return stories;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Story Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Create Story
        </Button>
      </Box>

      {/* Project Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 250, mr: 2 }}>
          <InputLabel>Project</InputLabel>
          <Select
            value={selectedProjectId || ''}
            label="Project"
            onChange={(e) => setSelectedProjectId(e.target.value as string)}
          >
            {projects?.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name} ({project.stats.totalStories} stories)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="All Stories" />
          <Tab label="In Progress" />
          <Tab label="Planning" />
          <Tab label="Completed" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {storiesLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Typography variant="body1" color="text.secondary">Loading stories...</Typography>
            </Box>
          ) : filteredStories().length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>No stories found</Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 0 ? 'No stories available yet.' : 'No stories match the current filter.'}
              </Typography>
            </Box>
          ) : (
            filteredStories().map((story) => (
            <Card key={story.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {story.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {story.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(story.status)}
                        label={story.status.toLowerCase().replace('_', ' ')}
                        color={getStatusColor(story.status) as any}
                        size="small"
                      />
                      <Chip
                        label={story.priority.toLowerCase()}
                        color={getPriorityColor(story.priority) as any}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${story.storyPoints || 0} pts`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => console.log('Edit story:', story.id)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(story.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated: {new Date(story.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Story Statistics
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Total Stories"
                    secondary={stories.length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="In Progress"
                    secondary={stories.filter(s => s.status === 'IN_PROGRESS').length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Completed"
                    secondary={stories.filter(s => s.status === 'DONE').length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Backlog"
                    secondary={stories.filter(s => s.status === 'BACKLOG').length}
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Completion Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stories.length > 0 ? (stories.filter(s => s.status === 'DONE').length / stories.length) * 100 : 0}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" gutterBottom>
                Total Story Points
              </Typography>
              <Typography variant="h6">
                {stories.reduce((acc, story) => acc + (story.storyPoints || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Story</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Story Title"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Estimated Hours"
                type="number"
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Story</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}