import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  List,
  ListItem,
  LinearProgress,
  Button,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useStories } from '../hooks/useStories';

export default function Projects() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createProject = useCreateProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: stories, isLoading: storiesLoading } = useStories({ projectId: selectedProjectId || undefined });
  
  // Create project dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState('PLANNING');

  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(() => projects?.find(p => p.id === selectedProjectId) || null, [projects, selectedProjectId]);

  const storiesByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    (stories || []).forEach(s => { map[s.status] = (map[s.status] || 0) + 1; });
    return map;
  }, [stories]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      await createProject.mutateAsync({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        status: newProjectStatus,
      });
      
      // Reset form and close dialog
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectStatus('PLANNING');
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Project
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>All Projects</Typography>
            {projectsLoading ? (
              <CircularProgress size={24} />
            ) : (
              <List>
                {(projects || []).map((p) => {
                  const progressPercentage = p.stats.totalStories > 0 
                    ? Math.round((p.stats.completedStories / p.stats.totalStories) * 100) 
                    : 0;
                  
                  return (
                    <ListItem
                      key={p.id}
                      sx={{
                        border: 1,
                        borderColor: selectedProjectId === p.id ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                        display: 'block',
                        p: 2
                      }}
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <Box width="100%">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" fontWeight="medium">{p.name}</Typography>
                          <Chip 
                            size="small" 
                            label={p.status.toLowerCase()} 
                            color={
                              p.status === 'IN_PROGRESS' ? 'primary' : 
                              p.status === 'PLANNING' ? 'default' : 
                              p.status === 'COMPLETED' ? 'success' : 'warning'
                            } 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {p.description}
                        </Typography>
                        
                        {/* Progress Section */}
                        <Box sx={{ mb: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress: {p.stats.completedStories} of {p.stats.totalStories} stories
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="medium">
                              {progressPercentage}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={progressPercentage} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: progressPercentage === 100 ? 'success.main' : 
                                  progressPercentage > 50 ? 'primary.main' : 'warning.main'
                              }
                            }} 
                          />
                        </Box>
                        
                        {/* Quick Stats */}
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          <Chip 
                            size="small" 
                            label={`${p.stats.totalStories} stories`} 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          <Chip 
                            size="small" 
                            label={`${p.stats.activeAgents} agents`} 
                            variant="outlined" 
                            color="primary"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 2 }}>
            {selectedProject ? (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5" fontWeight="bold">{selectedProject.name}</Typography>
                  <Chip 
                    label={selectedProject.status.toLowerCase()} 
                    color={
                      selectedProject.status === 'IN_PROGRESS' ? 'primary' : 
                      selectedProject.status === 'PLANNING' ? 'default' : 
                      selectedProject.status === 'COMPLETED' ? 'success' : 'warning'
                    }
                    size="medium"
                  />
                </Box>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedProject.description}
                </Typography>

                {/* Progress Overview */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Project Progress</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">Story Completion</Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                          <Typography variant="h6">
                            {selectedProject.stats.completedStories} / {selectedProject.stats.totalStories}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {selectedProject.stats.totalStories > 0 
                              ? Math.round((selectedProject.stats.completedStories / selectedProject.stats.totalStories) * 100)
                              : 0}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedProject.stats.totalStories > 0 
                            ? (selectedProject.stats.completedStories / selectedProject.stats.totalStories) * 100
                            : 0
                          } 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">Active Resources</Typography>
                        <Box display="flex" gap={2} sx={{ mt: 1 }}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="primary">
                              {selectedProject.stats.activeAgents}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Active Agents
                            </Typography>
                          </Box>
                          <Box textAlign="center">
                            <Typography variant="h6" color="secondary">
                              {selectedProject.stats.totalAgents}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Total Agents
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ mb: 2 }} />
                
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">Stories by Status</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {Object.entries(storiesByStatus).map(([status, count]) => {
                      const statusColor = 
                        status === 'DONE' ? 'success' :
                        status === 'IN_PROGRESS' ? 'warning' :
                        status === 'BACKLOG' ? 'default' :
                        status === 'IN_REVIEW' ? 'info' : 'default';
                      
                      return (
                        <Chip 
                          key={status} 
                          label={`${status.toLowerCase().replace('_', ' ')}: ${count}`} 
                          size="small"
                          color={statusColor as any}
                          variant="outlined"
                        />
                      );
                    })}
                    {Object.keys(storiesByStatus).length === 0 && (
                      <Typography variant="body2" color="text.secondary">No stories yet</Typography>
                    )}
                  </Box>
                </Box>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">Select a project to view details</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a project from the list to see its progress and story breakdown
                </Typography>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Project Stories</Typography>
            {storiesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={32} />
              </Box>
            ) : (stories || []).length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No stories in this project yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stories will appear here as they are created and assigned to this project
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {(stories || []).map((s) => {
                  const taskProgress = s.stats ? Math.round((s.stats.completedTasks / Math.max(1, s.stats.totalTasks)) * 100) : 0;
                  const hasStoryPoints = s.storyPoints && s.storyPoints > 0;
                  
                  return (
                    <ListItem 
                      key={s.id} 
                      sx={{ 
                        display: 'block', 
                        mb: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 2, 
                        p: 2,
                        '&:hover': { 
                          borderColor: 'primary.light',
                          backgroundColor: 'grey.50'
                        }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" fontWeight="medium" sx={{ flexGrow: 1, mr: 2 }}>
                          {s.title}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          {hasStoryPoints && (
                            <Chip 
                              size="small" 
                              label={`${s.storyPoints} pts`} 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          )}
                          <Chip 
                            size="small" 
                            label={s.status.toLowerCase().replace('_', ' ')} 
                            color={
                              s.status === 'DONE' ? 'success' : 
                              s.status === 'IN_PROGRESS' ? 'warning' : 
                              s.status === 'IN_REVIEW' ? 'info' :
                              'default'
                            } 
                          />
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {s.description}
                      </Typography>
                      
                      {/* Task Progress */}
                      {s.stats && s.stats.totalTasks > 0 && (
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Tasks: {s.stats.completedTasks} of {s.stats.totalTasks} completed
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="medium">
                              {taskProgress}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={taskProgress}
                            sx={{ 
                              height: 4, 
                              borderRadius: 2,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 2
                              }
                            }}
                          />
                        </Box>
                      )}
                      
                      {/* Story metadata */}
                      <Box display="flex" gap={1} mt={1}>
                        <Chip 
                          size="small" 
                          label={`Priority: ${s.priority.toLowerCase()}`} 
                          variant="outlined"
                          color={
                            s.priority === 'CRITICAL' ? 'error' :
                            s.priority === 'HIGH' ? 'warning' :
                            s.priority === 'MEDIUM' ? 'info' : 'default'
                          }
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        {s.stats && (
                          <Chip 
                            size="small" 
                            label={`${s.stats.totalTasks} tasks`} 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              label="Project Name"
              fullWidth
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newProjectStatus}
                label="Status"
                onChange={(e) => setNewProjectStatus(e.target.value)}
              >
                <MenuItem value="PLANNING">Planning</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {createProject.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {createProject.error instanceof Error ? createProject.error.message : 'Failed to create project'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProjectName.trim() || createProject.isPending}
          >
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


