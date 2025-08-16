import { useEffect, useMemo, useState, useRef } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography, Avatar, List, ListItem, CircularProgress, Menu, MenuItem, FormControl, InputLabel, Select, Collapse, IconButton } from '@mui/material';
import { PlayArrow as PlayIcon, NavigateNext as NextIcon, Person as PersonIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import axios from 'axios';
import type { BMADWorkflow } from '../config/bmadWorkflows';
import { BMAD_AGENTS } from '../config/bmadAgents';
import { apiClient, authStorage } from '../services/api';

interface WorkflowExecutionProps { open: boolean; onClose: () => void; workflow: BMADWorkflow }
interface ChatMessage { id: string; type: 'user' | 'agent' | 'system'; agentName?: string; agentType?: string; content: string; timestamp: Date; phase?: string }

export default function WorkflowExecution({ open, onClose, workflow }: WorkflowExecutionProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const currentPhase = useMemo(() => workflow.phases[phaseIndex], [workflow, phaseIndex]);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [currentProject, setCurrentProject] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  
  // Agent menu state
  const [agentMenuAnchor, setAgentMenuAnchor] = useState<HTMLElement | null>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);
  
  // Phase details collapse state
  const [phaseDetailsExpanded, setPhaseDetailsExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiClient.getProjects().then(setExistingProjects).catch(() => setExistingProjects([]));
    setPhaseIndex(0);
    setCurrentProject(null);
    setMessages([]);
  }, [open]);

  const seedIntro = (project: any) => {
    const intro: ChatMessage = { id: `${Date.now()}-${Math.random()}`, type: 'system', content: `🚀 Starting workflow: ${workflow.name}\n\n📁 Project: ${project.name}\n📋 Phase: ${currentPhase.name}\n🎯 Activities: ${currentPhase.activities.join(', ')}`, timestamp: new Date(), phase: currentPhase.name };
    setMessages([intro]);
  };

  const startWithNewProject = async () => {
    if (!newProject.name.trim()) return;
    try { setCreating(true); const created = await apiClient.createProject({ name: newProject.name.trim(), description: newProject.description.trim(), status: 'IN_PROGRESS' }); setCurrentProject(created); seedIntro(created);} finally { setCreating(false); }
  };
  const startWithExisting = async () => { if (!selectedExistingId) return; const proj = await apiClient.getProject(selectedExistingId); setCurrentProject(proj); seedIntro(proj); };

  const agentsForCurrentPhase = useMemo(() => { const involvement = (currentPhase as any).agentInvolvement as string[] | undefined; if (!involvement || involvement.length === 0) return BMAD_AGENTS; const names = involvement.map(s => s.split(' (')[0]); return BMAD_AGENTS.filter(a => names.includes(a.name)); }, [currentPhase]);

  // Handle agent selection from menu
  const handleAgentMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAgentMenuAnchor(event.currentTarget);
  };

  const handleAgentMenuClose = () => {
    setAgentMenuAnchor(null);
  };

  const handleAgentSelect = (agentName: string) => {
    setSelectedAgent(agentName);
    setAgentMenuAnchor(null);
  };

  const selectedAgentData = useMemo(() => 
    agentsForCurrentPhase.find(a => a.name === selectedAgent),
    [agentsForCurrentPhase, selectedAgent]
  );

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const userMsg: ChatMessage = { id: `${Date.now()}-${Math.random()}`, type: 'user', content: userInput, timestamp: new Date(), phase: currentPhase.name };
    setMessages(prev => [...prev, userMsg]); setUserInput(''); setSending(true);
    const recipients = selectedAgent ? agentsForCurrentPhase.filter(a => a.name === selectedAgent) : agentsForCurrentPhase;
    for (const agent of recipients) {
      try {
        const token = authStorage.getToken();
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat`, { message: userMsg.content, agentType: agent.type, agentName: agent.name, systemPrompt: agent.systemPrompt, context: `Project: ${currentProject?.name || ''}. Phase: ${currentPhase.name}. Activities: ${currentPhase.activities.join(', ')}`, provider: agent.defaultProvider || 'anthropic', model: agent.defaultModel }, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const content = res.data?.response || 'No response.';
        const reply: ChatMessage = { id: `${Date.now()}-${Math.random()}`, type: 'agent', agentName: agent.name, agentType: agent.type, content, timestamp: new Date(), phase: currentPhase.name };
        setMessages(prev => [...prev, reply]);
      } catch {
        const fallback: ChatMessage = { id: `${Date.now()}-${Math.random()}`, type: 'agent', agentName: agent.name, agentType: agent.type, content: `(${agent.name}) I had trouble responding just now.`, timestamp: new Date(), phase: currentPhase.name };
        setMessages(prev => [...prev, fallback]);
      }
    }
    setSending(false);
  };

  const nextPhase = () => { if (phaseIndex >= workflow.phases.length - 1) return; const np = phaseIndex + 1; setPhaseIndex(np); const sys: ChatMessage = { id: `${Date.now()}-${Math.random()}`, type: 'system', content: `🔄 Moving to next phase: ${workflow.phases[np].name}`, timestamp: new Date(), phase: workflow.phases[np].name }; setMessages(prev => [...prev, sys]); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Run Workflow</DialogTitle>
      <DialogContent>
        {!currentProject ? (
          <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Create New Project</Typography>
              <TextField label="Project Name" fullWidth sx={{ mb: 2 }} value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
              <TextField label="Description" fullWidth multiline minRows={2} sx={{ mb: 2 }} value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
              <Button variant="contained" startIcon={<PlayIcon />} onClick={startWithNewProject} disabled={!newProject.name.trim() || creating}>Create & Start</Button>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Link Existing Project</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Project</InputLabel>
                <Select label="Project" value={selectedExistingId} onChange={(e) => setSelectedExistingId(e.target.value)}>
                  {existingProjects.map((p) => (<MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={startWithExisting} disabled={!selectedExistingId}>Link & Start</Button>
            </Paper>
          </Box>
        ) : (
          <Box display="flex" gap={3} flexDirection={{ xs: 'column', lg: 'row' }}>
            {/* Left Column - Phase & Project Info */}
            <Box sx={{ minWidth: 320, maxWidth: { xs: '100%', lg: 380 } }}>
              {/* Project Info */}
              <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>📁 {currentProject.name}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>{currentProject.description}</Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Chip label="Active Project" color="success" size="small" />
                  <Chip label={`Phase ${phaseIndex + 1}/${workflow.phases.length}`} color="primary" size="small" />
                </Box>
                <Button size="small" variant="outlined" startIcon={<NextIcon />} onClick={nextPhase} disabled={phaseIndex >= workflow.phases.length - 1} fullWidth>
                  {phaseIndex >= workflow.phases.length - 1 ? 'Workflow Complete' : 'Next Phase'}
                </Button>
              </Paper>

              {/* Team Members */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>👥 Team Members</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Agents available in this phase:
                </Typography>
                <List dense>
                  {agentsForCurrentPhase.map((agent) => (
                    <ListItem key={agent.name} sx={{ pl: 0, py: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: agent.color || 'primary.main', fontSize: '0.9rem' }}>
                        {agent.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{agent.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{agent.type}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                          {agent.description}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Paper>


            </Box>

            {/* Right Column - Phase Details & Chat Interface */}
            <Box sx={{ flex: 1 }}>
              {/* Current Phase Details - Collapsible */}
              <Paper sx={{ mb: 2 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => setPhaseDetailsExpanded(!phaseDetailsExpanded)}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" color="primary">📋 {currentPhase.name}</Typography>
                    <Chip label={currentPhase.duration} size="small" variant="outlined" />
                  </Box>
                  <IconButton size="small">
                    {phaseDetailsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={phaseDetailsExpanded}>
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>{currentPhase.description}</Typography>
                    
                    <Typography variant="subtitle2" gutterBottom>🎯 Key Activities</Typography>
                    <List dense sx={{ pl: 0, mb: 2 }}>
                      {currentPhase.activities.map((activity, idx) => (
                        <ListItem key={idx} sx={{ pl: 0, py: 0.5 }}>
                          <Typography variant="body2">• {activity}</Typography>
                        </ListItem>
                      ))}
                    </List>
                    
                    <Typography variant="subtitle2" gutterBottom>📦 Deliverables</Typography>
                    <List dense sx={{ pl: 0 }}>
                      {currentPhase.deliverables.map((deliverable, idx) => (
                        <ListItem key={idx} sx={{ pl: 0, py: 0.5 }}>
                          <Typography variant="body2">• {deliverable}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Collapse>
              </Paper>

              <Paper sx={{ p: 3, height: '75vh', display: 'flex', flexDirection: 'column', border: 2, borderColor: 'primary.light' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h5" fontWeight="bold">💬 Workflow Chat</Typography>
                  <Chip label={`${currentPhase.name} Phase`} color="primary" size="medium" />
                </Box>
                
                {selectedAgent && (
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      size="small" 
                      label={`Chatting with ${selectedAgent}`} 
                      onDelete={() => setSelectedAgent('')}
                      color="primary"
                      avatar={selectedAgentData ? (
                        <Avatar sx={{ bgcolor: selectedAgentData.color || 'primary.main' }}>
                          {selectedAgentData.icon}
                        </Avatar>
                      ) : undefined}
                    />
                  </Box>
                )}
                
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <List sx={{ p: 0 }}>
                    {messages.map(m => (
                      <ListItem key={m.id} sx={{ display: 'block', p: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            {m.agentName ? `${m.agentName} (${m.phase})` : m.phase}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            backgroundColor: m.type === 'user' ? 'primary.main' : m.type === 'system' ? 'info.light' : 'grey.100', 
                            color: m.type === 'user' ? 'white' : 'text.primary',
                            borderRadius: 2
                          }}
                        >
                          {m.agentName && (
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                                {agentsForCurrentPhase.find(a => a.name === m.agentName)?.icon || '🤖'}
                              </Avatar>
                              <Typography variant="subtitle2" fontWeight="bold">{m.agentName}</Typography>
                            </Box>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                        </Paper>
                      </ListItem>
                    ))}
                    {sending && (
                      <ListItem sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CircularProgress size={16} />
                          <Typography variant="caption" color="text.secondary">
                            {selectedAgent ? `${selectedAgent} is thinking...` : 'Team is responding...'}
                          </Typography>
                        </Box>
                      </ListItem>
                    )}
                  </List>
                </Box>
                
                <Box display="flex" gap={1} alignItems="flex-end">
                  <Box sx={{ position: 'relative', flexGrow: 1 }}>
                    <TextField 
                      inputRef={textFieldRef}
                      fullWidth 
                      placeholder={`Ask ${selectedAgent || 'the team'} about ${currentPhase.name}...`} 
                      value={userInput} 
                      onChange={(e) => setUserInput(e.target.value)} 
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' && !e.shiftKey) { 
                          e.preventDefault(); 
                          sendMessage(); 
                        } 
                      }} 
                      multiline 
                      maxRows={3}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Button
                            size="small"
                            onClick={handleAgentMenuClick}
                            startIcon={selectedAgent && selectedAgentData ? (
                              <Avatar sx={{ width: 20, height: 20, bgcolor: selectedAgentData.color || 'primary.main', fontSize: '0.7rem' }}>
                                {selectedAgentData.icon}
                              </Avatar>
                            ) : <PersonIcon />}
                            sx={{ 
                              mr: 1,
                              minWidth: 'auto',
                              bgcolor: selectedAgent ? 'action.selected' : 'action.hover',
                              color: 'text.primary',
                              textTransform: 'none',
                              fontSize: '0.8rem',
                              '&:hover': {
                                bgcolor: selectedAgent ? 'action.selected' : 'action.focus',
                              }
                            }}
                          >
                            {selectedAgent ? selectedAgent : 'Select Agent'}
                          </Button>
                        ),
                      }}
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    onClick={sendMessage} 
                    disabled={!userInput.trim() || sending}
                    sx={{ minWidth: 80 }}
                  >
                    Send
                  </Button>
                </Box>

                {/* Agent Selection Menu */}
                <Menu
                  anchorEl={agentMenuAnchor}
                  open={Boolean(agentMenuAnchor)}
                  onClose={handleAgentMenuClose}
                  PaperProps={{
                    sx: { minWidth: 280, maxHeight: 400 }
                  }}
                >
                  <MenuItem onClick={() => handleAgentSelect('')}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'action.hover' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">All Agents</Typography>
                        <Typography variant="caption" color="text.secondary">Team Discussion</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  {agentsForCurrentPhase.map((agent) => (
                    <MenuItem key={agent.name} onClick={() => handleAgentSelect(agent.name)}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: agent.color || 'primary.main' }}>
                          {agent.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">{agent.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{agent.type}</Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {agent.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              </Paper>


            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}