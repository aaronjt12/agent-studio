export type AgentType = 'analyst' | 'pm' | 'architect' | 'scrum-master';

export type AgentStatus = 'active' | 'idle' | 'stopped' | 'error';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description?: string;
  lastActivity?: string;
  createdAt: string;
  configuration?: AgentConfiguration;
  capabilities?: string[];
  version?: string;
}

export interface AgentConfiguration {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  customInstructions?: string;
  enableMemory?: boolean;
  memorySize?: number;
  tools?: string[];
  model?: string;
  provider?: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  baseUrl?: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentConversation {
  id: string;
  agentId: string;
  title?: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  defaultConfiguration: AgentConfiguration;
  systemPrompt: string;
  examples?: string[];
  tags?: string[];
}

export interface CreateAgentOptions {
  type: AgentType;
  name: string;
  description?: string;
  template?: string;
  configuration?: Partial<AgentConfiguration>;
  useTemplate?: boolean;
}

export interface AgentResponse {
  content: string;
  confidence?: number;
  reasoning?: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface AgentListOptions {
  status?: AgentStatus;
  type?: AgentType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AgentStats {
  total: number;
  byStatus: Record<AgentStatus, number>;
  byType: Record<AgentType, number>;
  totalMessages: number;
  averageResponseTime: number;
  uptime: Record<string, number>;
}

export interface CollaborationRequest {
  id: string;
  title: string;
  description: string;
  agents: string[];
  flow: 'sequential' | 'parallel' | 'custom';
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  context?: string;
  expectedOutputs?: string[];
}

export interface CollaborationResult {
  id: string;
  request: CollaborationRequest;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  artifacts: CollaborationArtifact[];
  summary?: string;
  metrics?: CollaborationMetrics;
}

export interface CollaborationArtifact {
  id: string;
  type: 'document' | 'code' | 'analysis' | 'plan' | 'story';
  title: string;
  content: string;
  author: string;
  createdAt: string;
  version: number;
  format: 'markdown' | 'json' | 'yaml' | 'xml' | 'text';
}

export interface CollaborationMetrics {
  totalTime: number;
  agentParticipation: Record<string, number>;
  messageCount: number;
  artifactCount: number;
  qualityScore?: number;
  completionRate: number;
}