import React, { useState } from 'react';
import WorkflowExecution from '../components/WorkflowExecution';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { AGENT_STUDIO_WORKFLOWS, getAgentWorkflowsByComplexity, getAgentWorkflowsByAgentType } from '../config/agentWorkflows';
import { AGENT_STUDIO_AGENTS } from '../config/agentAgents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AgentStudioWorkflows() {
  const [tabValue, setTabValue] = useState(0);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | false>(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [workflowExecutionOpen, setWorkflowExecutionOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleWorkflowExpand = (workflowId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedWorkflow(isExpanded ? workflowId : false);
  };

  const handleRunWorkflow = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setWorkflowExecutionOpen(true);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      default: return 'default';
    }
  };

  const renderWorkflowCard = (workflow: any) => (
    <Card key={workflow.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {workflow.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {workflow.description}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              label={workflow.complexity}
              color={getComplexityColor(workflow.complexity) as any}
              size="small"
            />
            <Chip
              icon={<ScheduleIcon />}
              label={workflow.estimatedDuration}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayIcon />}
              onClick={() => handleRunWorkflow(workflow)}
              sx={{ ml: 1 }}
            >
              Run Workflow
            </Button>
          </Box>
        </Box>

        <Accordion
          expanded={expandedWorkflow === workflow.id}
          onChange={handleWorkflowExpand(workflow.id)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" color="primary">
              View Workflow Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* Phases */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Workflow Phases
              </Typography>
              {workflow.phases.map((phase: any, index: number) => (
                <Paper key={phase.id} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {index + 1}. {phase.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {phase.description}
                  </Typography>
                  <Box display="flex" gap={2} mb={2}>
                    <Chip
                      icon={<ScheduleIcon />}
                      label={phase.duration}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<GroupIcon />}
                      label={`${phase.agentInvolvement.length} agents`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Activities:
                      </Typography>
                      <List dense>
                        {phase.activities.map((activity: string, idx: number) => (
                          <ListItem key={idx} sx={{ py: 0 }}>
                            <ListItemText primary={activity} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Agent Involvement:
                      </Typography>
                      <List dense>
                        {phase.agentInvolvement.map((agent: string, idx: number) => (
                          <ListItem key={idx} sx={{ py: 0 }}>
                            <ListItemText primary={agent} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {/* Agent Roles */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Agent Roles & Responsibilities
              </Typography>
              {workflow.agentRoles.map((role: any) => {
                const agent = AGENT_STUDIO_AGENTS.find(a => a.type === role.agentType);
                return (
                  <Paper key={role.agentType} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ mr: 2 }}>
                        {agent?.name || role.agentType}
                      </Typography>
                      <Chip
                        label={role.agentType.replace('_', ' ')}
                        size="small"
                        color="primary"
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Primary Responsibilities:
                        </Typography>
                        <List dense>
                          {role.primaryResponsibilities.map((resp: string, idx: number) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemText primary={resp} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Collaboration Points:
                        </Typography>
                        <List dense>
                          {role.collaborationPoints.map((collab: string, idx: number) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemText primary={collab} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Deliverables:
                        </Typography>
                        <List dense>
                          {role.deliverables.map((deliverable: string, idx: number) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemText primary={deliverable} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}

              {/* Deliverables */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Workflow Deliverables
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {workflow.deliverables.map((deliverable: string, index: number) => (
                  <Chip
                    key={index}
                    label={deliverable}
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Agent Studio Workflows
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Explore predefined workflows that demonstrate how Agent Studio agents collaborate to deliver software projects.
        Each workflow includes detailed phases, agent roles, and collaboration patterns.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="workflow tabs">
          <Tab label="All Workflows" />
          <Tab label="By Complexity" />
          <Tab label="By Agent Type" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h5" gutterBottom>
          All Available Workflows
        </Typography>
        {AGENT_STUDIO_WORKFLOWS.map(renderWorkflowCard)}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h5" gutterBottom>
          Workflows by Complexity
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="success.main">
              Low Complexity
            </Typography>
            {getAgentWorkflowsByComplexity('LOW').map(renderWorkflowCard)}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="warning.main">
              Medium Complexity
            </Typography>
            {getAgentWorkflowsByComplexity('MEDIUM').map(renderWorkflowCard)}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="error.main">
              High Complexity
            </Typography>
            {getAgentWorkflowsByComplexity('HIGH').map(renderWorkflowCard)}
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" gutterBottom>
          Workflows by Agent Type
        </Typography>
        <Grid container spacing={3}>
          {AGENT_STUDIO_AGENTS.map((agent) => (
            <Grid item xs={12} md={6} key={agent.type}>
              <Typography variant="h6" gutterBottom>
                {agent.name} ({agent.type.replace('_', ' ')})
              </Typography>
              {getAgentWorkflowsByAgentType(agent.type).map(renderWorkflowCard)}
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Workflow Execution Dialog */}
      {selectedWorkflow && (
        <WorkflowExecution
          open={workflowExecutionOpen}
          onClose={() => {
            setWorkflowExecutionOpen(false);
            setSelectedWorkflow(null);
          }}
          workflow={selectedWorkflow}
        />
      )}
    </Box>
  );
}
