import { Agent } from '@prisma/client';
import { prisma } from '../server';

export interface AIProvider {
  generateResponse(prompt: string, systemPrompt?: string, configuration?: any): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private clientPromise: Promise<any> | null = null;

  private async getClient(): Promise<any> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const mod = await import('openai');
        const OpenAI = (mod as any).default || (mod as any);
        return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      })();
    }
    return this.clientPromise;
  }

  async generateResponse(prompt: string, systemPrompt?: string, configuration?: any): Promise<string> {
    try {
      const client = await this.getClient();
      const response = await client.chat.completions.create({
        model: configuration?.model || 'gpt-4',
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt },
        ],
        temperature: configuration?.temperature || 0.7,
        max_tokens: configuration?.maxTokens || 1000,
      });

      return response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }
}

export class AnthropicProvider implements AIProvider {
  private clientPromise: Promise<any> | null = null;

  private async getClient(): Promise<any> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const mod = await import('@anthropic-ai/sdk');
        const Anthropic = (mod as any).default || (mod as any);
        return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      })();
    }
    return this.clientPromise;
  }

  async generateResponse(prompt: string, systemPrompt?: string, configuration?: any): Promise<string> {
    try {
      const client = await this.getClient();
      const response = await client.messages.create({
        model: configuration?.model || 'claude-3-haiku-20240307',
        max_tokens: configuration?.maxTokens || 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      return 'I apologize, but I was unable to generate a response.';
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error('Failed to generate response from Anthropic');
    }
  }
}

export class MockAIProvider implements AIProvider {
  async generateResponse(prompt: string, systemPrompt?: string, configuration?: any): Promise<string> {
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate contextual responses based on agent type and prompt
    const responses = this.generateContextualResponse(prompt, systemPrompt);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateContextualResponse(prompt: string, systemPrompt?: string): string[] {
    const lowerPrompt = prompt.toLowerCase();

    // Analyst responses
    if (systemPrompt?.includes('Requirements Analyst')) {
      if (lowerPrompt.includes('requirement')) {
        return [
          `I've analyzed your requirements request. Here are the key areas we should focus on:\n\n1. **Functional Requirements**: What specific features and capabilities do you need?\n2. **Non-functional Requirements**: Performance, security, and scalability considerations\n3. **User Stories**: Who will use this and what are their goals?\n4. **Acceptance Criteria**: How will we know when it's done?\n\nCould you provide more details about the specific domain or use case you're working with?`,
          `Based on your request, I recommend we start with a requirements gathering workshop. We should identify:\n\n• Primary stakeholders and their needs\n• Business objectives and success metrics\n• Technical constraints and dependencies\n• Risk factors and mitigation strategies\n\nWhat's the scope of the project you're planning?`
        ];
      }
      return [
        `As your Requirements Analyst, I'm here to help you define clear, actionable requirements. What specific aspect of your project would you like me to analyze?`,
        `I can help you with requirements elicitation, analysis, and documentation. What business problem are we trying to solve?`
      ];
    }

    // PM responses
    if (systemPrompt?.includes('Product Manager')) {
      if (lowerPrompt.includes('roadmap') || lowerPrompt.includes('priority')) {
        return [
          `Let's discuss your product roadmap priorities. I recommend we:\n\n1. **Assess current market position** and user feedback\n2. **Evaluate feature requests** against business objectives\n3. **Consider technical debt** and infrastructure needs\n4. **Plan release cycles** and milestone targets\n\nWhat are your top business goals for the next quarter?`,
          `For effective prioritization, I use the RICE framework (Reach, Impact, Confidence, Effort). Let's evaluate your feature backlog:\n\n• Which features affect the most users?\n• What's the expected business impact?\n• How confident are we in our assumptions?\n• What's the development effort required?\n\nWhat features are you considering?`
        ];
      }
      return [
        `As your Product Manager, I'm focused on maximizing product value and user satisfaction. What product challenges can I help you address?`,
        `I can help with product strategy, feature prioritization, and stakeholder alignment. What's on your product roadmap?`
      ];
    }

    // Architect responses
    if (systemPrompt?.includes('System Architect')) {
      if (lowerPrompt.includes('architecture') || lowerPrompt.includes('design')) {
        return [
          `Let me help you design a robust system architecture. Key considerations:\n\n**Scalability**: How many users/requests do you expect?\n**Performance**: What are your latency requirements?\n**Security**: What data protection is needed?\n**Integration**: Which external systems must you connect to?\n**Technology Stack**: Any constraints or preferences?\n\nWhat type of system are you building?`,
          `For your architecture design, I recommend following these principles:\n\n1. **Separation of Concerns**: Clear boundaries between layers\n2. **Loose Coupling**: Minimize dependencies between components\n3. **High Cohesion**: Related functionality grouped together\n4. **Fault Tolerance**: Graceful handling of failures\n5. **Observability**: Comprehensive logging and monitoring\n\nWhat are your specific architectural challenges?`
        ];
      }
      return [
        `As your System Architect, I'm here to design scalable, maintainable solutions. What architectural challenges are you facing?`,
        `I can help with system design, technology selection, and architectural patterns. What type of system are you building?`
      ];
    }

    // Scrum Master responses
    if (systemPrompt?.includes('Scrum Master')) {
      if (lowerPrompt.includes('sprint') || lowerPrompt.includes('story')) {
        return [
          `Let's break down your epic into manageable user stories. For each story, we need:\n\n**User Story Format**: As a [user], I want [goal] so that [benefit]\n**Acceptance Criteria**: Clear, testable conditions\n**Story Points**: Effort estimation using Fibonacci sequence\n**Dependencies**: What needs to be done first?\n\nWhat epic or feature should we decompose?`,
          `For effective sprint planning, I recommend:\n\n1. **Story Refinement**: Ensure stories are well-defined and estimated\n2. **Capacity Planning**: Consider team availability and velocity\n3. **Sprint Goal**: Define clear objective for the sprint\n4. **Risk Assessment**: Identify potential blockers\n\nWhat's your target for the upcoming sprint?`
        ];
      }
      return [
        `As your Scrum Master, I'm here to facilitate your agile journey and remove impediments. What can I help you with today?`,
        `I can help with sprint planning, story breakdown, and process improvement. What agile practices would you like to discuss?`
      ];
    }

    // Generic helpful responses
    return [
      `I understand you're asking about: "${prompt}"\n\nBased on my expertise, I can help you approach this systematically. Could you provide more context about your specific goals and constraints?`,
      `Thank you for your question. To provide the most helpful response, I'd like to understand:\n\n• What's the broader context of this request?\n• Are there any specific constraints I should consider?\n• What's your timeline and success criteria?\n\nPlease share more details so I can assist you effectively.`,
      `I'm here to help with your request. Let me break this down and provide some guidance:\n\n1. First, let's clarify the scope and requirements\n2. Then we can identify the key challenges and risks\n3. Finally, I'll recommend a structured approach\n\nWhat additional information can you provide about your situation?`
    ];
  }
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    // Initialize providers based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider());
    }
  }

  async generateResponse(agent: Agent, message: string, conversationId: string): Promise<string> {
    try {
      // Get conversation history for context
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 10 // Limit context to last 10 messages
      });

      // Build context from conversation history
      const context = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const fullPrompt = context ? `Previous conversation:\n${context}\n\nUser: ${message}` : message;

      // Determine which provider to use
      let configuration: any = undefined;
      try {
        // If configuration is stored as a JSON string in DB (SQLite), parse it
        configuration = typeof (agent as any).configuration === 'string'
          ? JSON.parse((agent as any).configuration)
          : (agent as any).configuration;
      } catch {}

      // Build provider attempt order: explicit preference first, then others that are available
      const preferred = this.getPreferredProvider(configuration);
      const candidateOrder = Array.from(this.providers.keys())
        .filter((id) => id !== 'mock');
      const orderedProviders = [preferred, ...candidateOrder.filter(id => id !== preferred)];

      for (const id of orderedProviders) {
        const provider = this.providers.get(id);
        if (!provider) continue;
        try {
          const providerConfig = this.normalizeConfigForProvider(id, configuration);
          const result = await provider.generateResponse(
            fullPrompt,
            (agent as any).systemPrompt || undefined,
            providerConfig
          );
          console.info(`AI provider '${id}' responded using model '${providerConfig?.model}'`);
          return result;
        } catch (provErr) {
          console.warn(`AI provider '${id}' failed, trying next provider...`, (provErr as Error)?.message || provErr);
          continue;
        }
      }

      // Nothing succeeded
      throw new Error('No AI providers succeeded for this request');
    } catch (error) {
      console.error('AI Service error:', error);
      throw error;
    }
  }

  private getPreferredProvider(configuration: any): string {
    if (configuration?.provider) {
      return configuration.provider;
    }

    // Auto-select best available provider
    if (this.providers.has('openai')) return 'openai';
    if (this.providers.has('anthropic')) return 'anthropic';
    return 'none';
  }

  private normalizeConfigForProvider(providerId: string, configuration: any): any {
    const normalized: any = { ...(configuration || {}) };
    normalized.provider = providerId;

    const model = normalized.model as string | undefined;
    if (model) {
      const looksAnthropic = /^(claude|haiku|sonnet|opus)/i.test(model) || model.includes('claude-');
      const looksOpenAI = /^gpt/i.test(model) || model.includes('gpt-');

      if (providerId === 'openai' && looksAnthropic) {
        delete normalized.model;
      }
      if (providerId === 'anthropic' && looksOpenAI) {
        delete normalized.model;
      }
    }

    if (!normalized.model) {
      if (providerId === 'openai') normalized.model = 'gpt-4';
      if (providerId === 'anthropic') normalized.model = 'claude-3-haiku-20240307';
    }

    return normalized;
  }

  async generateStoryFromRequirements(requirements: string, agentId: string): Promise<{
    title: string;
    description: string;
    acceptanceCriteria: string[];
    storyPoints: number;
  }> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      const prompt = `Based on the following requirements, generate a user story:

Requirements: ${requirements}

Please provide:
1. A concise title
2. A detailed description in "As a [user], I want [goal] so that [benefit]" format
3. 3-5 acceptance criteria
4. Estimated story points (1, 2, 3, 5, 8, 13)

Format the response as JSON.`;

      const response = await this.generateResponse(agent, prompt, 'story-generation');

      // Try to parse as JSON, fallback to structured parsing
      try {
        return JSON.parse(response);
      } catch {
        return this.parseStoryResponse(response);
      }
    } catch (error) {
      console.error('Story generation error:', error);
      throw error;
    }
  }

  private parseStoryResponse(response: string): {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    storyPoints: number;
  } {
    // Basic parsing logic for non-JSON responses
    const lines = response.split('\n');
    
    return {
      title: lines.find(line => line.toLowerCase().includes('title'))?.replace(/title:?/i, '').trim() || 'User Story',
      description: lines.find(line => line.toLowerCase().includes('description') || line.includes('As a'))?.replace(/description:?/i, '').trim() || 'User story description',
      acceptanceCriteria: lines
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || line.includes('criteria'))
        .map(line => line.replace(/^[-•]\s*/, '').replace(/criteria:?/i, '').trim())
        .filter(criteria => criteria.length > 0)
        .slice(0, 5),
      storyPoints: 5 // Default estimation
    };
  }

  // New method for workflow chat
  async generateResponse(prompt: string, provider?: string, model?: string): Promise<string> {
    try {
      // Use specified provider or default to anthropic
      const selectedProvider = provider || 'anthropic';
      const selectedModel = model || this.getDefaultModel(selectedProvider);
      
      // Get the appropriate AI provider
      const aiProvider = this.providers.get(selectedProvider);
      if (!aiProvider) {
        throw new Error(`Unsupported AI provider: ${selectedProvider}`);
      }

      // Generate response using the selected provider
      const response = await aiProvider.generateResponse(prompt, undefined, { model: selectedModel });
      
      // Log the response for debugging
      console.log(`AI Response from ${selectedProvider} (${selectedModel}): ${response.substring(0, 100)}...`);
      
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }
}

export default AIService;