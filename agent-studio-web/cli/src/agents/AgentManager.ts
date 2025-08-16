import fs from 'fs-extra';
import path from 'path';
import { Agent, AgentType, AgentStatus, CreateAgentOptions, AgentListOptions, AgentResponse, AgentMessage } from '../types/agent';
import { generateId } from '../utils/helpers';

export class AgentManager {
  private configDir: string;
  private agentsFile: string;
  private agents: Map<string, Agent> = new Map();
  private conversations: Map<string, AgentMessage[]> = new Map();

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(process.cwd(), '.bmad');
    this.agentsFile = path.join(this.configDir, 'agents.json');
    this.loadAgents();
  }

  private async loadAgents(): Promise<void> {
    try {
      if (await fs.pathExists(this.agentsFile)) {
        const data = await fs.readJson(this.agentsFile);
        this.agents = new Map(Object.entries(data.agents || {}));
      }
    } catch (error: any) {
      console.warn('Could not load agents:', error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
    }
  }

  private async saveAgents(): Promise<void> {
    try {
      await fs.ensureDir(this.configDir);
      const data = {
        agents: Object.fromEntries(this.agents.entries()),
        lastUpdated: new Date().toISOString()
      };
      await fs.writeJson(this.agentsFile, data, { spaces: 2 });
    } catch (error: any) {
      throw new Error(`Failed to save agents: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`);
    }
  }

  async createAgent(options: CreateAgentOptions): Promise<Agent> {
    const agent: Agent = {
      id: generateId(),
      name: options.name,
      type: options.type,
      status: 'stopped',
      description: options.description,
      createdAt: new Date().toISOString(),
      configuration: this.getDefaultConfiguration(options.type, options.configuration),
      capabilities: this.getAgentCapabilities(options.type),
      version: '1.0.0'
    };

    // Apply template if requested
    if (options.useTemplate !== false) {
      const template = this.getAgentTemplate(options.type);
      if (template) {
        agent.description = agent.description || template.description;
        agent.configuration = { ...template.defaultConfiguration, ...agent.configuration };
        agent.capabilities = template.capabilities;
      }
    }

    this.agents.set(agent.id, agent);
    await this.saveAgents();

    return agent;
  }

  async listAgents(options: AgentListOptions = {}): Promise<Agent[]> {
    let agents = Array.from(this.agents.values());

    if (options.status) {
      agents = agents.filter(agent => agent.status === options.status);
    }

    if (options.type) {
      agents = agents.filter(agent => agent.type === options.type);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      agents = agents.filter(agent => 
        agent.name.toLowerCase().includes(search) ||
        agent.description?.toLowerCase().includes(search)
      );
    }

    if (options.limit) {
      const start = options.offset || 0;
      agents = agents.slice(start, start + options.limit);
    }

    return agents.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAgent(idOrName: string): Promise<Agent | null> {
    // Try exact ID match first
    if (this.agents.has(idOrName)) {
      return this.agents.get(idOrName)!;
    }

    // Try partial ID match
    for (const [id, agent] of this.agents.entries()) {
      if (id.startsWith(idOrName)) {
        return agent;
      }
    }

    // Try name match
    for (const agent of this.agents.values()) {
      if (agent.name.toLowerCase() === idOrName.toLowerCase()) {
        return agent;
      }
    }

    return null;
  }

  async startAgent(idOrName: string): Promise<void> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    if (agent.status === 'active') {
      return; // Already active
    }

    // Simulate agent startup
    await new Promise(resolve => setTimeout(resolve, 500));

    agent.status = 'active';
    agent.lastActivity = new Date().toISOString();
    
    this.agents.set(agent.id, agent);
    await this.saveAgents();
  }

  async stopAgent(idOrName: string): Promise<void> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    if (agent.status === 'stopped') {
      return; // Already stopped
    }

    // Simulate agent shutdown
    await new Promise(resolve => setTimeout(resolve, 300));

    agent.status = 'stopped';
    agent.lastActivity = new Date().toISOString();
    
    this.agents.set(agent.id, agent);
    await this.saveAgents();
  }

  async updateAgent(idOrName: string, updates: Partial<Agent>): Promise<Agent> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    const updatedAgent = { ...agent, ...updates };
    updatedAgent.lastActivity = new Date().toISOString();
    
    this.agents.set(agent.id, updatedAgent);
    await this.saveAgents();

    return updatedAgent;
  }

  async removeAgent(idOrName: string): Promise<void> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    // Stop agent if running
    if (agent.status === 'active') {
      await this.stopAgent(agent.id);
    }

    this.agents.delete(agent.id);
    this.conversations.delete(agent.id);
    await this.saveAgents();
  }

  async sendMessage(idOrName: string, message: string, options?: { contextFile?: string }): Promise<string> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    if (agent.status !== 'active') {
      throw new Error(`Agent is not active (status: ${agent.status})`);
    }

    // Get or create conversation
    if (!this.conversations.has(agent.id)) {
      this.conversations.set(agent.id, []);
    }
    const conversation = this.conversations.get(agent.id)!;

    // Add user message
    const userMessage: AgentMessage = {
      id: generateId(),
      agentId: agent.id,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    conversation.push(userMessage);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate response based on agent type
    const response = this.generateAgentResponse(agent, message, conversation);

    // Add agent response
    const agentMessage: AgentMessage = {
      id: generateId(),
      agentId: agent.id,
      role: 'agent',
      content: response.content,
      timestamp: new Date().toISOString(),
      metadata: response.metadata
    };
    conversation.push(agentMessage);

    // Update agent activity
    agent.lastActivity = new Date().toISOString();
    this.agents.set(agent.id, agent);
    await this.saveAgents();

    return response.content;
  }

  async waitForReady(idOrName: string, timeout: number = 30000): Promise<void> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    const startTime = Date.now();
    while (agent.status !== 'active' && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (agent.status !== 'active') {
      throw new Error(`Agent did not become ready within ${timeout}ms`);
    }
  }

  async getConversationHistory(idOrName: string): Promise<AgentMessage[]> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    return this.conversations.get(agent.id) || [];
  }

  async clearConversationHistory(idOrName: string): Promise<void> {
    const agent = await this.getAgent(idOrName);
    if (!agent) {
      throw new Error(`Agent not found: ${idOrName}`);
    }

    this.conversations.set(agent.id, []);
  }

  private getDefaultConfiguration(type: AgentType, overrides?: any): any {
    const defaults = {
      temperature: 0.7,
      maxTokens: 1000,
      enableMemory: true,
      memorySize: 10,
      provider: 'openai'
    };

    const typeSpecific = {
      analyst: { temperature: 0.5, maxTokens: 1500 },
      pm: { temperature: 0.6, maxTokens: 1200 },
      architect: { temperature: 0.4, maxTokens: 2000 },
      'scrum-master': { temperature: 0.7, maxTokens: 1000 }
    };

    return { ...defaults, ...typeSpecific[type], ...overrides };
  }

  private getAgentCapabilities(type: AgentType): string[] {
    const capabilities = {
      analyst: [
        'Requirements gathering',
        'Stakeholder analysis', 
        'Use case definition',
        'Acceptance criteria creation',
        'Business process modeling'
      ],
      pm: [
        'Product roadmap creation',
        'Feature prioritization',
        'Market analysis',
        'Stakeholder communication',
        'Metrics definition'
      ],
      architect: [
        'System design',
        'Technology selection',
        'Performance optimization',
        'Security considerations',
        'Scalability planning'
      ],
      'scrum-master': [
        'Story breakdown',
        'Sprint planning',
        'Process improvement',
        'Team coordination',
        'Risk identification'
      ]
    };

    return capabilities[type] || [];
  }

  private getAgentTemplate(type: AgentType): any {
    const templates = {
      analyst: {
        description: 'Analyzes requirements and creates detailed specifications',
        defaultConfiguration: { temperature: 0.5, maxTokens: 1500 },
        capabilities: this.getAgentCapabilities('analyst')
      },
      pm: {
        description: 'Manages product strategy and roadmap planning',
        defaultConfiguration: { temperature: 0.6, maxTokens: 1200 },
        capabilities: this.getAgentCapabilities('pm')
      },
      architect: {
        description: 'Designs scalable and maintainable system architectures',
        defaultConfiguration: { temperature: 0.4, maxTokens: 2000 },
        capabilities: this.getAgentCapabilities('architect')
      },
      'scrum-master': {
        description: 'Facilitates agile development and story breakdown',
        defaultConfiguration: { temperature: 0.7, maxTokens: 1000 },
        capabilities: this.getAgentCapabilities('scrum-master')
      }
    };

    return templates[type];
  }

  private generateAgentResponse(agent: Agent, message: string, conversation: AgentMessage[]): AgentResponse {
    // This is a mock implementation - in a real system, this would call actual AI models
    const responses = {
      analyst: [
        "Based on your requirements, I need to understand the key stakeholders and their needs. Can you provide more details about the user personas and their primary goals?",
        "I've analyzed your request. The functional requirements include user authentication, data validation, and error handling. Let me break down the acceptance criteria...",
        "From a requirements perspective, we need to consider both functional and non-functional requirements. The user story should include clear success metrics."
      ],
      pm: [
        "From a product perspective, this feature aligns well with our strategic objectives. Let me prioritize this against our current roadmap and identify dependencies.",
        "I recommend we approach this as an MVP first. The core functionality should focus on solving the primary user pain point, with advanced features in subsequent iterations.",
        "Based on market analysis, this feature could significantly impact user engagement. I suggest we define success metrics and plan A/B testing for validation."
      ],
      architect: [
        "From a technical architecture standpoint, I recommend a microservices approach with clear API boundaries. We should consider scalability and maintainability from the start.",
        "The system design should incorporate security best practices, including authentication, authorization, and data encryption. Let me outline the key components...",
        "I suggest we use event-driven architecture for this feature to ensure loose coupling and better resilience. Here's my recommended technology stack..."
      ],
      'scrum-master': [
        "Let me break this down into manageable development stories. I estimate this as a 13-point epic that we can split into 5 stories across 2 sprints.",
        "I see potential risks and dependencies here. We should address the API integration complexity early and plan for thorough testing cycles.",
        "Based on team capacity and velocity, I recommend we prioritize the core functionality first and consider the advanced features for the next iteration."
      ]
    };

    const agentResponses = responses[agent.type] || ["I understand your request and will help you with that."];
    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];

    return {
      content: randomResponse,
      confidence: 0.8 + Math.random() * 0.2,
      metadata: {
        responseTime: Date.now(),
        conversationLength: conversation.length
      }
    };
  }
}