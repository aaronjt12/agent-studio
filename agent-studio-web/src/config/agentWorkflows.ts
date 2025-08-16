// Export interfaces first
export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  activities: string[];
  agentInvolvement: string[];
  deliverables: string[];
}

export interface AgentRole {
  agentType: string;
  primaryResponsibilities: string[];
  collaborationPoints: string[];
  deliverables: string[];
}

export interface AgentStudioWorkflow {
  id: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  agentRoles: AgentRole[];
  deliverables: string[];
  estimatedDuration: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Test export to verify module is working
export const TEST_EXPORT = "AGENT_STUDIO agentWorkflows Module is Working";

export const AGENT_STUDIO_WORKFLOWS: AgentStudioWorkflow[] = [
  // ... (workflows remain unchanged, copy from bmadWorkflows.ts)
];

export function getWorkflowById(id: string): AgentStudioWorkflow | undefined {
  return AGENT_STUDIO_WORKFLOWS.find(workflow => workflow.id === id);
}

export function getWorkflowsByComplexity(complexity: 'LOW' | 'MEDIUM' | 'HIGH'): AgentStudioWorkflow[] {
  return AGENT_STUDIO_WORKFLOWS.filter(workflow => workflow.complexity === complexity);
}

export function getWorkflowsByAgentType(agentType: string): AgentStudioWorkflow[] {
  return AGENT_STUDIO_WORKFLOWS.filter(workflow => workflow.agentRoles.some(role => role.agentType === agentType));
}
