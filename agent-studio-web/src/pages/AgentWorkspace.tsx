import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Psychology as PsychologyIcon,
  Business as BusinessIcon,
  Architecture as ArchitectureIcon,
  Engineering as EngineeringIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Code as CodeIcon,
  BugReport as BugReportIcon,
  DesignServices as DesignIcon,
  Cloud as CloudIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAgents, useCreateAgent, useStartAgent, useStopAgent, useChatWithAgent, useDeleteAgent, useUpdateAgent } from '../hooks/useAgents';
import { apiClient } from '../services/api';
import { AGENT_STUDIO_AGENTS, getDefaultAgentNames, getAgentIcon, getAgentColor } from '../config/agentAgents';

const agentTypeOptions = [
  { value: 'ANALYST', label: '🔍 Requirements Analyst', icon: <PsychologyIcon />, color: 'primary' },
  { value: 'PM', label: '📋 Product Manager', icon: <BusinessIcon />, color: 'secondary' },
  { value: 'ARCHITECT', label: '🏗️ System Architect', icon: <ArchitectureIcon />, color: 'info' },
  { value: 'SCRUM_MASTER', label: '🎯 Scrum Master', icon: <EngineeringIcon />, color: 'success' },
  { value: 'DEVELOPER', label: '💻 Developer', icon: <CodeIcon />, color: 'success' },
  { value: 'TESTER', label: '🧪 Tester', icon: <BugReportIcon />, color: 'error' },
  { value: 'DESIGNER', label: '🎨 Designer', icon: <DesignIcon />, color: 'purple' },
  { value: 'DEVOPS', label: '☁️ DevOps Engineer', icon: <CloudIcon />, color: 'orange' },
];

const agentIcons = {
  ANALYST: PsychologyIcon,
  PM: BusinessIcon,
  ARCHITECT: ArchitectureIcon,
  SCRUM_MASTER: EngineeringIcon,
  DEVELOPER: CodeIcon,
  TESTER: BugReportIcon,
  DESIGNER: DesignIcon,
  DEVOPS: CloudIcon,
};

const defaultAgentNames = getDefaultAgentNames();

export default function AgentWorkspace() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [agentDetailDialogOpen, setAgentDetailDialogOpen] = useState(false);
  const [teamDetailDialogOpen, setTeamDetailDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState(0); // 0: Overview, 1: Teams, 2: Individual Agents
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [newAgent, setNewAgent] = useState({
    name: '',
    type: '',
    description: '',
    provider: '',
    model: '',
    systemPrompt: '',
  });
  const [createMode, setCreateMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [autoDialogOpen, setAutoDialogOpen] = useState(false);
  const [autoProvider, setAutoProvider] = useState('');
  const [autoModel, setAutoModel] = useState('');
  const [autoCreating, setAutoCreating] = useState(false);
  const [providerOptions, setProviderOptions] = useState<Array<{ id: string; name: string; models: string[] }>>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editAgent, setEditAgent] = useState<{ name: string; description: string; systemPrompt: string; provider: string; model: string }>({
    name: '',
    description: '',
    systemPrompt: '',
    provider: '',
    model: ''
  });

  const { data: agents, isLoading, error } = useAgents();
  const createAgentMutation = useCreateAgent();
  const startAgentMutation = useStartAgent();
  const stopAgentMutation = useStopAgent();
  const chatMutation = useChatWithAgent();
  const deleteAgentMutation = useDeleteAgent();
  const updateAgentMutation = useUpdateAgent();

  // Validation helpers
  const isDuplicateName = !!(newAgent.name && agents?.some(a => a.name.trim().toLowerCase() === newAgent.name.trim().toLowerCase()));

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoadingProviders(true);
        const { providers } = await apiClient.getAIProviders();
        setProviderOptions(providers.map(p => ({ id: p.id, name: p.name, models: p.models || [] })));
      } catch (e) {
        // Fallback defaults
        setProviderOptions([
          { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'] },
          { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-5-opus-20241022'] },
          { id: 'mock', name: 'Mock AI (Development)', models: ['mock-model'] },
        ]);
      } finally {
        setLoadingProviders(false);
      }
    };
    loadProviders();
  }, []);

  const getModelsForProvider = (providerId: string) => {
    const found = providerOptions.find(p => p.id === providerId);
    return found?.models || [];
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name || !newAgent.type) return;

    try {
      await createAgentMutation.mutateAsync({
        name: newAgent.name,
        type: newAgent.type,
        description: newAgent.description,
        systemPrompt: newAgent.systemPrompt || undefined,
        configuration:
          newAgent.provider || newAgent.model
            ? {
                ...(newAgent.provider ? { provider: newAgent.provider } : {}),
                ...(newAgent.model ? { model: newAgent.model } : {}),
              }
            : undefined,
      });
      
      setCreateDialogOpen(false);
      setNewAgent({ name: '', type: '', description: '', provider: '', model: '', systemPrompt: '' });
      setSelectedTemplate('');
      setCreateMode('template');
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const handleAutoCreateTeam = async () => {
    try {
      setAutoCreating(true);
      
      for (const agentAgent of AgentStudio_AGENTS) {
        console.log(`Creating agent: ${agentAgent.name} with description: ${agentAgent.description}`);
        await createAgentMutation.mutateAsync({
          name: agentAgent.name,
          type: agentAgent.type,
          description: agentAgent.description,
          systemPrompt: agentAgent.systemPrompt,
          configuration: {
            ...(autoProvider ? { provider: autoProvider } : { provider: agentAgent.defaultProvider }),
            ...(autoModel ? { model: autoModel } : { model: agentAgent.defaultModel }),
          },
        });
      }

      setAutoDialogOpen(false);
      setAutoProvider('');
      setAutoModel('');
    } catch (error) {
      console.error('Failed to auto-create team:', error);
    } finally {
      setAutoCreating(false);
    }
  };

  const handleStartAgent = async (agentId: string) => {
    try {
      await startAgentMutation.mutateAsync(agentId);
    } catch (error) {
      console.error('Failed to start agent:', error);
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      await stopAgentMutation.mutateAsync(agentId);
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await deleteAgentMutation.mutateAsync(agentId);
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleDeleteAllAgents = async () => {
    try {
      if (!agents || agents.length === 0) {
        setDeleteAllDialogOpen(false);
        return;
      }
      setDeletingAll(true);
      const ids = agents.map(a => a.id);
      for (const id of ids) {
        // sequential to reduce server load
        await deleteAgentMutation.mutateAsync(id);
      }
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete all agents:', error);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleChatWithAgent = async () => {
    if (!chatMessage.trim() || !selectedAgent) return;

    try {
      const response = await chatMutation.mutateAsync({
        id: selectedAgent.id,
        message: chatMessage,
      });

      setChatHistory(prev => [
        ...prev,
        { type: 'user', message: chatMessage, timestamp: new Date() },
        { type: 'agent', message: response.message, timestamp: new Date(response.timestamp) }
      ]);
      
      setChatMessage('');
    } catch (error) {
      console.error('Failed to chat with agent:', error);
    }
  };

  const openChat = (agent: any) => {
    setSelectedAgent(agent);
    setChatHistory([]);
    setChatDialogOpen(true);
  };

  const openAgentDetail = (agent: any) => {
    setSelectedAgent(agent);
    setIsEditingAgent(false);
    setEditAgent({
      name: agent.name || '',
      description: agent.description || '',
      systemPrompt: agent.systemPrompt || '',
      provider: agent.configuration?.provider || '',
      model: agent.configuration?.model || ''
    });
    setAgentDetailDialogOpen(true);
  };

  const handleSaveAgentEdits = async () => {
    if (!selectedAgent) return;
    try {
      await updateAgentMutation.mutateAsync({
        id: selectedAgent.id,
        data: {
          name: editAgent.name,
          description: editAgent.description,
          systemPrompt: editAgent.systemPrompt,
          configuration: {
            ...(editAgent.provider ? { provider: editAgent.provider } : {}),
            ...(editAgent.model ? { model: editAgent.model } : {}),
          },
        },
      });
      setIsEditingAgent(false);
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  };

  const openTeamDetail = (team: any) => {
    setSelectedTeam(team);
    setTeamDetailDialogOpen(true);
  };

  const toggleTeamExpansion = (teamName: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamName)) {
      newExpanded.delete(teamName);
    } else {
      newExpanded.add(teamName);
    }
    setExpandedTeams(newExpanded);
  };

  // Group agents into teams based on Agent Studio configuration
  const organizeAgentsIntoTeams = () => {
    if (!agents) return { teams: [], individualAgents: [] };

    const agentAgentNames = AgentStudio_AGENTS.map(a => a.name);
    const agentTeamAgents: any[] = [];
    const individualAgents: any[] = [];

    agents.forEach(agent => {
      if (agentAgentNames.includes(agent.name)) {
        agentTeamAgents.push(agent);
      } else {
        individualAgents.push(agent);
      }
    });

    // Create team structure
    const teams = [];
    if (agentTeamAgents.length > 0) {
      // Group by workflow expertise
      const developmentTeam = agentTeamAgents.filter(a => 
        ['DEVELOPER', 'TESTER', 'DEVOPS'].includes(a.type)
      );
      const planningTeam = agentTeamAgents.filter(a => 
        ['ANALYST', 'PM', 'ARCHITECT'].includes(a.type)
      );
      const designTeam = agentTeamAgents.filter(a => 
        ['DESIGNER', 'SCRUM_MASTER'].includes(a.type)
      );

      if (planningTeam.length > 0) {
        teams.push({
          name: 'Planning & Architecture Team',
          description: 'Requirements, planning, and system architecture',
          agents: planningTeam,
          icon: '📋',
          color: 'primary'
        });
      }

      if (developmentTeam.length > 0) {
        teams.push({
          name: 'Development & QA Team',
          description: 'Development, testing, and deployment',
          agents: developmentTeam,
          icon: '💻',
          color: 'success'
        });
      }

      if (designTeam.length > 0) {
        teams.push({
          name: 'Design & Process Team',
          description: 'UX/UI design and agile process management',
          agents: designTeam,
          icon: '🎨',
          color: 'secondary'
        });
      }

      // If we have a complete Agent Studio team, add it as well
      if (agentTeamAgents.length >= 8) {
        teams.unshift({
          name: 'Complete Agent Studio Team',
          description: 'Full Business Method & Analysis Development team',
          agents: agentTeamAgents,
          icon: '🚀',
          color: 'warning'
        });
      }
    }

    // Show ALL agents in the Individual Agents tab, including team members
    return { teams, individualAgents: agents };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'IDLE': return 'warning';
      case 'STOPPED': return 'default';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load agents. Please try again later.
        </Alert>
      </Box>
    );
  }

  const { teams, individualAgents } = organizeAgentsIntoTeams();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Agent Workspace
        </Typography>
        <Box display="flex" gap={1}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Agent
        </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setAutoDialogOpen(true)}
          >
            Auto-Create Team
          </Button>
          <Button
            variant="text"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteAllDialogOpen(true)}
            disabled={!agents || agents.length === 0}
          >
            Delete All
          </Button>
        </Box>
      </Box>

      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Manage your AI agents, configure their capabilities, and collaborate on development tasks.
      </Typography>

      {agents && agents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No agents created yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first AI agent to get started with collaborative development.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Agent
          </Button>
        </Paper>
      ) : (
        <Box>
          {/* Navigation Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentView} onChange={(_, newValue) => setCurrentView(newValue)}>
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <GroupIcon />
                    Overview
                    <Badge badgeContent={agents?.length || 0} color="primary" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <GroupIcon />
                    Teams
                    <Badge badgeContent={teams.length} color="success" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon />
                    Individual Agents
                    <Badge badgeContent={individualAgents.length} color="info" />
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          {/* Overview Tab */}
          {currentView === 0 && (
            <Box>
              {/* Quick Stats */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">{agents?.length || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Agents</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">{teams.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Teams Formed</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {agents?.filter(a => a.status === 'ACTIVE').length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Active Agents</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Teams Overview */}
              {teams.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>Teams</Typography>
                  <Grid container spacing={2}>
                    {teams.map((team) => (
                      <Grid item xs={12} sm={6} md={4} key={team.name}>
                        <Card 
                          sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
                          onClick={() => openTeamDetail(team)}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                              <Typography variant="h5" sx={{ mr: 1 }}>{team.icon}</Typography>
                              <Typography variant="h6" flex={1}>{team.name}</Typography>
                              <Chip label={`${team.agents.length} agents`} size="small" color={team.color} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {team.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Individual Agents Overview */}
              {individualAgents.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Individual Agents</Typography>
                  <Grid container spacing={2}>
                    {individualAgents.slice(0, 6).map((agent) => {
                      const agentAgent = AGENT_STUDIO_AGENTS.find(ba => ba.name === agent.name) || AGENT_STUDIO_AGENTS.find(ba => ba.type === agent.type);
                      const agentIcon = agentAgent?.icon || '🤖';
                      const agentColor = agentAgent?.color || 'primary.main';
            
            return (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                          <Card 
                            sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}
                            onClick={() => openAgentDetail(agent)}
                          >
                  <CardContent>
                              <Box display="flex" alignItems="center" mb={1}>
                                <Avatar sx={{ bgcolor: agentColor, mr: 1, fontSize: '1rem', width: 32, height: 32 }}>
                                  {agentIcon}
                      </Avatar>
                                <Typography variant="h6" flex={1}>{agent.name}</Typography>
                                <Chip label={agent.status} size="small" color={getStatusColor(agent.status)} />
                              </Box>
                        <Typography variant="body2" color="text.secondary">
                          {agent.type.replace('_', ' ')}
                        </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {individualAgents.length > 6 && (
                    <Box textAlign="center" mt={2}>
                      <Button onClick={() => setCurrentView(2)} endIcon={<PersonIcon />}>
                        View All {individualAgents.length} Individual Agents
                      </Button>
                      </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Teams Tab */}
          {currentView === 1 && (
            <Box>
              {teams.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>No Teams Formed</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Auto-create a Agent Studio team to see team organization features.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SettingsIcon />}
                    onClick={() => setAutoDialogOpen(true)}
                  >
                    Auto-Create Team
                  </Button>
                </Paper>
              ) : (
                <List>
                  {teams.map((team) => (
                    <Box key={team.name}>
                      <ListItem 
                        onClick={() => toggleTeamExpansion(team.name)}
                        sx={{ 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 1, 
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${team.color}.main` }}>
                            {team.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={team.name}
                          secondary={`${team.description} • ${team.agents.length} agents`}
                        />
                        <Box display="flex" gap={1} mr={2}>
                          <Chip label={`${team.agents.filter(a => a.status === 'ACTIVE').length} active`} size="small" color="success" />
                          <Chip label={`${team.agents.length} total`} size="small" color={team.color} />
                    </Box>
                        <IconButton>
                          {expandedTeams.has(team.name) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </ListItem>
                      
                      <Collapse in={expandedTeams.has(team.name)}>
                        <Paper sx={{ ml: 4, p: 2, mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Team Members</Typography>
                          <List dense>
                            {team.agents.map((agent: any) => {
                              const agentAgent = AGENT_STUDIO_AGENTS.find(ba => ba.name === agent.name);
                              const agentIcon = agentAgent?.icon || '🤖';
                              const agentColor = agentAgent?.color || 'primary.main';
                              
                              return (
                                <ListItem 
                                  key={agent.id}
                                  onClick={() => openAgentDetail(agent)}
                                  sx={{ borderRadius: 1, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                                >
                                  <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: agentColor, width: 32, height: 32, fontSize: '0.9rem' }}>
                                      {agentIcon}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText 
                                    primary={agent.name}
                                    secondary={`${agent.type.replace('_', ' ')} • ${agent.description?.slice(0, 60) || 'No description'}...`}
                                  />
                                  <ListItemSecondaryAction>
                                    <Box display="flex" gap={0.5}>
                                      <Chip label={agent.status} size="small" color={getStatusColor(agent.status)} />
                                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openChat(agent); }} disabled={agent.status !== 'ACTIVE'}>
                                        <ChatIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openAgentDetail(agent); }}>
                                        <InfoIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </ListItemSecondaryAction>
                                </ListItem>
                              );
                            })}
                          </List>
                        </Paper>
                      </Collapse>
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Individual Agents Tab */}
          {currentView === 2 && (
            <Box>
              {individualAgents.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>No Individual Agents</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                    All your agents are part of teams. Create a custom agent to see it here.
                    </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Create Custom Agent
                  </Button>
                </Paper>
              ) : (
                <List>
                  {individualAgents.map((agent) => {
                    const agentAgent = AGENT_STUDIO_AGENTS.find(ba => ba.name === agent.name) || AGENT_STUDIO_AGENTS.find(ba => ba.type === agent.type);
                    const agentIcon = agentAgent?.icon || '🤖';
                    const agentColor = agentAgent?.color || 'primary.main';
                    
                    return (
                      <ListItem 
                        key={agent.id}
                        onClick={() => openAgentDetail(agent)}
                        sx={{ 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 1, 
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: agentColor }}>
                            {agentIcon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={agent.name}
                          secondary={`${agent.type.replace('_', ' ')} • ${agent.description || 'No description provided'}`}
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" gap={1} alignItems="center">
                            <Chip label={agent.status} size="small" color={getStatusColor(agent.status)} />
                            <IconButton onClick={(e) => { e.stopPropagation(); openChat(agent); }} disabled={agent.status !== 'ACTIVE'}>
                        <ChatIcon />
                      </IconButton>
                            <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteAgent(agent.id); }} disabled={deleteAgentMutation.isPending}>
                              <DeleteIcon />
                            </IconButton>
                      {agent.status === 'ACTIVE' ? (
                              <IconButton onClick={(e) => { e.stopPropagation(); handleStopAgent(agent.id); }} disabled={stopAgentMutation.isPending}>
                          <StopIcon />
                        </IconButton>
                      ) : (
                              <IconButton onClick={(e) => { e.stopPropagation(); handleStartAgent(agent.id); }} disabled={startAgentMutation.isPending}>
                          <PlayArrowIcon />
                        </IconButton>
                      )}
                    </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
            );
          })}
                </List>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Create Agent Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Agent</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button variant={createMode === 'template' ? 'contained' : 'outlined'} onClick={() => setCreateMode('template')}>From Template</Button>
            <Button variant={createMode === 'custom' ? 'contained' : 'outlined'} onClick={() => setCreateMode('custom')}>Custom</Button>
          </Box>

          {createMode === 'template' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Select a Agent Studio Template</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Template</InputLabel>
                <Select
                  value={selectedTemplate}
                  label="Template"
                  onChange={(e) => {
                    const templateId = e.target.value as string;
                    setSelectedTemplate(templateId);
                    const agent = AGENT_STUDIO_AGENTS.find(a => a.id === templateId || a.name === templateId || a.type === templateId);
                    if (agent) {
                      setNewAgent({
                        name: agent.name,
                        type: agent.type,
                        description: agent.description,
                        provider: agent.defaultProvider || '',
                        model: agent.defaultModel || '',
                        systemPrompt: agent.systemPrompt,
                      });
                    }
                  }}
                >
                  {AGENT_STUDIO_AGENTS.map(a => (
                    <MenuItem key={a.id} value={a.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.9rem', bgcolor: a.color }}>{a.icon}</Avatar>
                        <span>{a.name} ({a.type})</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mb: 2 }}>
                The fields below are pre-filled from the template. You can tweak them before creating.
              </Alert>
            </Box>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Agent Name"
            fullWidth
            variant="outlined"
            value={newAgent.name}
            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
            sx={{ mb: 2 }}
            error={isDuplicateName}
            helperText={isDuplicateName ? 'An agent with this name already exists. Please choose a different name.' : ' '}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Agent Type</InputLabel>
            <Select
              value={newAgent.type}
              onChange={(e) => {
                const value = e.target.value as string;
                setNewAgent({
                  ...newAgent,
                  type: value,
                  name: newAgent.name || defaultAgentNames[value] || newAgent.name,
                });
              }}
              label="Agent Type"
            >
              {agentTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newAgent.description}
            onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>AI Provider (optional)</InputLabel>
            <Select
              value={newAgent.provider}
              onChange={(e) => setNewAgent({ ...newAgent, provider: e.target.value as string, model: '' })}
              label="AI Provider (optional)"
              disabled={loadingProviders}
            >
              <MenuItem value="">Auto (use available)</MenuItem>
              {providerOptions.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }} disabled={!newAgent.provider || getModelsForProvider(newAgent.provider).length === 0}>
            <InputLabel>Model (optional)</InputLabel>
            <Select
              value={newAgent.model}
              onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value as string })}
              label="Model (optional)"
            >
              {getModelsForProvider(newAgent.provider).map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="System Prompt (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newAgent.systemPrompt}
            onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAgent}
            variant="contained"
            disabled={!newAgent.name || !newAgent.type || isDuplicateName || createAgentMutation.isPending}
          >
            {createAgentMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatDialogOpen} onClose={() => setChatDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chat with {selectedAgent?.name}
        </DialogTitle>
        <DialogContent sx={{ height: 400 }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
              {chatHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                  Start a conversation with {selectedAgent?.name}
                </Typography>
              ) : (
                chatHistory.map((chat, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color={chat.type === 'user' ? 'primary' : 'secondary'}>
                      {chat.type === 'user' ? 'You' : selectedAgent?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {chat.message}
                    </Typography>
                  </Box>
                ))
              )}
              {chatMutation.isPending && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    {selectedAgent?.name} is thinking...
                  </Typography>
                </Box>
              )}
            </Box>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatWithAgent();
                  }
                }}
                multiline
                maxRows={3}
              />
              <Button 
                variant="contained" 
                onClick={handleChatWithAgent}
                disabled={!chatMessage.trim() || chatMutation.isPending}
              >
                Send
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Auto-create Team Dialog */}
      <Dialog open={autoDialogOpen} onClose={() => setAutoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Auto-Create Agent Studio Team</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This creates a complete team of Agent Studio agents with their proper names and specialized system prompts:
            Alex (Analyst), Karen (PM), Mike (Architect), Sarah (Scrum Master), David (Developer), Emma (Tester), Lisa (Designer), Tom (DevOps).
            Optionally specify a provider and model that all agents should use, or let them use their default configurations.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>AI Provider (optional)</InputLabel>
            <Select
              value={autoProvider}
              onChange={(e) => { setAutoProvider(e.target.value as string); setAutoModel(''); }}
              label="AI Provider (optional)"
              disabled={loadingProviders}
            >
              <MenuItem value="">Auto (use available)</MenuItem>
              {providerOptions.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={!autoProvider || getModelsForProvider(autoProvider).length === 0}>
            <InputLabel>Model (optional)</InputLabel>
            <Select
              value={autoModel}
              onChange={(e) => setAutoModel(e.target.value as string)}
              label="Model (optional)"
            >
              {getModelsForProvider(autoProvider).map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAutoCreateTeam} variant="contained" disabled={autoCreating}>
            {autoCreating ? <CircularProgress size={20} /> : 'Create Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Agents Dialog */}
      <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete All Agents</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete all agents in your workspace. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAllAgents} variant="contained" color="error" disabled={deletingAll}>
            {deletingAll ? <CircularProgress size={20} /> : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Agent Detail Dialog */}
      <Dialog open={agentDetailDialogOpen} onClose={() => setAgentDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {selectedAgent && (
              <>
                <Avatar sx={{ 
                  bgcolor: AGENT_STUDIO_AGENTS.find(ba => ba.name === selectedAgent.name)?.color || 'primary.main',
                  width: 48,
                  height: 48,
                  fontSize: '1.5rem'
                }}>
                  {AGENT_STUDIO_AGENTS.find(ba => ba.name === selectedAgent.name)?.icon || '🤖'}
                </Avatar>
                <Box>
                  {isEditingAgent ? (
                    <TextField
                      size="small"
                      label="Name"
                      value={editAgent.name}
                      onChange={(e) => setEditAgent({ ...editAgent, name: e.target.value })}
                    />
                  ) : (
                    <Typography variant="h5">{selectedAgent.name}</Typography>
                  )}
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedAgent.type.replace('_', ' ')}
                  </Typography>
                </Box>
                <Box flex={1} />
                <Chip label={selectedAgent.status} color={getStatusColor(selectedAgent.status)} />
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAgent && (
            <Box>
              {/* Agent Description */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                {isEditingAgent ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={editAgent.description}
                    onChange={(e) => setEditAgent({ ...editAgent, description: e.target.value })}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {selectedAgent.description || 'No description provided'}
                  </Typography>
                )}
              </Paper>

              {/* Agent Studio Agent Info */}
              {AGENT_STUDIO_AGENTS.find(ba => ba.name === selectedAgent.name) && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Capabilities</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {AGENT_STUDIO_AGENTS.find(ba => ba.name === selectedAgent.name)?.capabilities.map((capability, index) => (
                      <Chip
                        key={index}
                        label={capability}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                  <Typography variant="subtitle2" gutterBottom>System Prompt</Typography>
                  {isEditingAgent ? (
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      value={editAgent.systemPrompt}
                      onChange={(e) => setEditAgent({ ...editAgent, systemPrompt: e.target.value })}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedAgent.systemPrompt || AGENT_STUDIO_AGENTS.find(ba => ba.name === selectedAgent.name)?.systemPrompt}
                    </Typography>
                  )}
                </Paper>
              )}

              {/* Configuration */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Configuration</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Provider</Typography>
                    {isEditingAgent ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={editAgent.provider}
                          onChange={(e) => setEditAgent({ ...editAgent, provider: e.target.value as string, model: '' })}
                        >
                          <MenuItem value="">Default</MenuItem>
                          {providerOptions.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {selectedAgent.configuration?.provider || 'Default'}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Model</Typography>
                    {isEditingAgent ? (
                      <FormControl fullWidth size="small" disabled={!editAgent.provider}>
                        <Select
                          value={editAgent.model}
                          onChange={(e) => setEditAgent({ ...editAgent, model: e.target.value as string })}
                        >
                          <MenuItem value="">Default</MenuItem>
                          {providerOptions.find(p => p.id === editAgent.provider)?.models.map(m => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {selectedAgent.configuration?.model || 'Default'}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Created</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(selectedAgent.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Last Updated</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(selectedAgent.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Actions */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Actions</Typography>
                <Box display="flex" gap={1}>
                  {!isEditingAgent ? (
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditingAgent(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        onClick={() => { setIsEditingAgent(false); setEditAgent({
                          name: selectedAgent.name || '',
                          description: selectedAgent.description || '',
                          systemPrompt: selectedAgent.systemPrompt || '',
                          provider: selectedAgent.configuration?.provider || '',
                          model: selectedAgent.configuration?.model || ''
                        }); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveAgentEdits}
                        disabled={updateAgentMutation.isPending}
                      >
                        {updateAgentMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<ChatIcon />}
                    onClick={() => {
                      setAgentDetailDialogOpen(false);
                      openChat(selectedAgent);
                    }}
                    disabled={selectedAgent.status !== 'ACTIVE'}
                  >
                    Chat
                  </Button>
                  
                  {selectedAgent.status === 'ACTIVE' ? (
                    <Button
                      variant="outlined"
                      startIcon={<StopIcon />}
                      onClick={() => handleStopAgent(selectedAgent.id)}
                      disabled={stopAgentMutation.isPending}
                    >
                      Stop Agent
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleStartAgent(selectedAgent.id)}
                      disabled={startAgentMutation.isPending}
                    >
                      Start Agent
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      handleDeleteAgent(selectedAgent.id);
                      setAgentDetailDialogOpen(false);
                    }}
                    disabled={deleteAgentMutation.isPending}
                  >
                    Delete
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgentDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Team Detail Dialog */}
      <Dialog open={teamDetailDialogOpen} onClose={() => setTeamDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {selectedTeam && (
              <>
                <Avatar sx={{ 
                  bgcolor: `${selectedTeam.color}.main`,
                  width: 48,
                  height: 48,
                  fontSize: '1.5rem'
                }}>
                  {selectedTeam.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedTeam.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedTeam.description}
                  </Typography>
                </Box>
                <Box flex={1} />
                <Chip label={`${selectedTeam.agents.length} agents`} color={selectedTeam.color} />
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTeam && (
            <Box>
              {/* Team Stats */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">{selectedTeam.agents.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Agents</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {selectedTeam.agents.filter((a: any) => a.status === 'ACTIVE').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Active</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {selectedTeam.agents.filter((a: any) => a.status === 'IDLE').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Idle</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="text.secondary">
                      {selectedTeam.agents.filter((a: any) => a.status === 'STOPPED').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Stopped</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Team Members */}
              <Typography variant="h6" gutterBottom>Team Members</Typography>
              <List>
                {selectedTeam.agents.map((agent: any) => {
                  const agentAgent = AGENT_STUDIO_AGENTS.find(ba => ba.name === agent.name);
                  const agentIcon = agentAgent?.icon || '🤖';
                  const agentColor = agentAgent?.color || 'primary.main';
                  
                  return (
                    <ListItem 
                      key={agent.id}
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        mb: 1,
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: agentColor }}>
                          {agentIcon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>{agent.name}</span>
                            <Chip label={agent.status} size="small" color={getStatusColor(agent.status)} />
                          </span>
                        }
                        secondary={
                          <React.Fragment>
                            <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {agent.type.replace('_', ' ')} • {agent.description || 'No description'}
                            </span>
                            {agentAgent && (
                              <span style={{ display: 'inline-block', width: '100%', marginTop: '8px' }}>
                                {agentAgent.capabilities.slice(0, 4).map((capability, index) => (
                                  <Chip
                                    key={index}
                                    label={capability}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', margin: '2px' }}
                                  />
                                ))}
                              </span>
                            )}
                          </React.Fragment>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <IconButton onClick={() => {
                            setTeamDetailDialogOpen(false);
                            openAgentDetail(agent);
                          }}>
                            <InfoIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => {
                              setTeamDetailDialogOpen(false);
                              openChat(agent);
                            }} 
                            disabled={agent.status !== 'ACTIVE'}
                          >
                            <ChatIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}