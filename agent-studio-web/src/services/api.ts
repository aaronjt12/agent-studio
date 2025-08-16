import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'ANALYST' | 'PM' | 'ARCHITECT' | 'SCRUM_MASTER' | 'DEVELOPER' | 'TESTER' | 'DESIGNER' | 'DEVOPS';
  description?: string;
  status: 'ACTIVE' | 'IDLE' | 'STOPPED' | 'ERROR';
  configuration?: any;
  systemPrompt?: string;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  stats: {
    totalStories: number;
    completedStories: number;
    totalAgents: number;
    activeAgents: number;
  };
  agents: Agent[];
}

export interface Story {
  id: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'READY' | 'IN_PROGRESS' | 'IN_REVIEW' | 'TESTING' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  storyPoints?: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
  assignedAgents: Agent[];
  stats: {
    totalTasks: number;
    completedTasks: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Auth storage
class AuthStorage {
  private readonly TOKEN_KEY = 'bmad_auth_token';
  private readonly USER_KEY = 'bmad_user';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  clear(): void {
    this.removeToken();
    this.removeUser();
  }
}

export const authStorage = new AuthStorage();

// API Client
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use((config) => {
      const token = authStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          authStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    email: string;
    username: string;
    password: string;
    name?: string;
  }): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(data: {
    login: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async getMe(): Promise<{ user: User }> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Agent endpoints
  async getAgents(params?: {
    status?: string;
    type?: string;
    projectId?: string;
  }): Promise<Agent[]> {
    const response = await this.client.get('/agents', { params });
    return response.data;
  }

  async createAgent(data: {
    name: string;
    type: string;
    description?: string;
    systemPrompt?: string;
    configuration?: any;
  }): Promise<Agent> {
    const response = await this.client.post('/agents', data);
    return response.data;
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await this.client.get(`/agents/${id}`);
    return response.data;
  }

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    const response = await this.client.put(`/agents/${id}`, data);
    return response.data;
  }

  async startAgent(id: string): Promise<void> {
    await this.client.post(`/agents/${id}/start`);
  }

  async stopAgent(id: string): Promise<void> {
    await this.client.post(`/agents/${id}/stop`);
  }

  async chatWithAgent(
    id: string,
    message: string,
    conversationId?: string
  ): Promise<{
    conversationId: string;
    message: string;
    timestamp: string;
  }> {
    const response = await this.client.post(`/agents/${id}/chat`, {
      message,
      conversationId,
    });
    return response.data;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.client.delete(`/agents/${id}`);
  }

  // Project endpoints
  async getProjects(params?: {
    status?: string;
    search?: string;
  }): Promise<Project[]> {
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async createProject(data: {
    name: string;
    description?: string;
    status?: string;
  }): Promise<Project> {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  async addAgentToProject(
    projectId: string,
    agentId: string,
    role?: string
  ): Promise<void> {
    await this.client.post(`/projects/${projectId}/agents`, {
      agentId,
      role,
    });
  }

  async removeAgentFromProject(
    projectId: string,
    agentId: string
  ): Promise<void> {
    await this.client.delete(`/projects/${projectId}/agents/${agentId}`);
  }

  async getProjectDashboard(id: string): Promise<any> {
    const response = await this.client.get(`/projects/${id}/dashboard`);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  // Story endpoints
  async getStories(params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assignedAgentId?: string;
  }): Promise<Story[]> {
    const response = await this.client.get('/stories', { params });
    return response.data;
  }

  async getStoriesForProject(projectId: string): Promise<Story[]> {
    return this.getStories({ projectId });
  }

  async createStory(data: {
    title: string;
    description: string;
    projectId: string;
    priority?: string;
    storyPoints?: number;
    status?: string;
  }): Promise<Story> {
    const response = await this.client.post('/stories', data);
    return response.data;
  }

  async generateStory(data: {
    requirements: string;
    projectId: string;
    agentId?: string;
  }): Promise<{
    story: Story;
    generationDetails: any;
  }> {
    const response = await this.client.post('/stories/generate', data);
    return response.data;
  }

  async getStory(id: string): Promise<Story> {
    const response = await this.client.get(`/stories/${id}`);
    return response.data;
  }

  async updateStory(id: string, data: Partial<Story>): Promise<Story> {
    const response = await this.client.put(`/stories/${id}`, data);
    return response.data;
  }

  async assignAgentToStory(
    storyId: string,
    agentId: string,
    role?: string
  ): Promise<void> {
    await this.client.post(`/stories/${storyId}/agents`, {
      agentId,
      role,
    });
  }

  async removeAgentFromStory(storyId: string, agentId: string): Promise<void> {
    await this.client.delete(`/stories/${storyId}/agents/${agentId}`);
  }

  async deleteStory(id: string): Promise<void> {
    await this.client.delete(`/stories/${id}`);
  }

  // AI endpoints
  async aiChat(data: {
    message: string;
    agentId?: string;
    conversationId?: string;
    systemPrompt?: string;
    context?: string;
  }): Promise<{
    response: string;
    timestamp: string;
    agentId: string;
    conversationId?: string;
  }> {
    const response = await this.client.post('/ai/chat', data);
    return response.data;
  }

  async generateStoryFromRequirements(data: {
    requirements: string;
    agentId?: string;
    projectId?: string;
  }): Promise<{
    story: any;
    agentUsed: string;
  }> {
    const response = await this.client.post('/ai/generate-story', data);
    return response.data;
  }

  async reviewCode(data: {
    code: string;
    language?: string;
    context?: string;
    agentId?: string;
  }): Promise<{
    review: string;
    timestamp: string;
    language?: string;
    agentUsed: string;
  }> {
    const response = await this.client.post('/ai/code-review', data);
    return response.data;
  }

  async explainCode(data: {
    code: string;
    language?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<{
    explanation: string;
    timestamp: string;
    language?: string;
    level: string;
    agentUsed: string;
  }> {
    const response = await this.client.post('/ai/explain-code', data);
    return response.data;
  }

  async getAIProviders(): Promise<{
    providers: Array<{
      id: string;
      name: string;
      models: string[];
      status: string;
    }>;
    defaultProvider: string;
  }> {
    const response = await this.client.get('/ai/providers');
    return response.data;
  }

  // Terminal (CLI) endpoints
  async checkTerminalTools(): Promise<{
    tools: Array<{ id: string; installed: boolean; version: string }>
  }> {
    const response = await this.client.get('/terminal/check');
    return response.data;
  }

  async execTerminalCommand(data: {
    command: 'claude' | 'openai';
    args?: string[];
  }): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const response = await this.client.post('/terminal/exec', data);
    return response.data;
  }

  // Codebase endpoints
  async uploadCodebase(formData: FormData): Promise<any> {
    const response = await this.client.post('/codebase/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async flattenCodebase(data: {
    source: string;
    sourceType: 'directory' | 'snapshot';
    format?: 'xml' | 'json' | 'markdown';
    name?: string;
    includeComments?: boolean;
    minifyOutput?: boolean;
    includePatterns?: string[];
    excludePatterns?: string[];
  }): Promise<any> {
    const response = await this.client.post('/codebase/flatten', data);
    return response.data;
  }

  async getCodebaseSnapshots(params?: {
    projectId?: string;
    format?: string;
  }): Promise<any[]> {
    const response = await this.client.get('/codebase/snapshots', { params });
    return response.data;
  }

  async downloadSnapshot(id: string): Promise<Blob> {
    const response = await this.client.get(`/codebase/snapshots/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async analyzeCodebase(directory: string): Promise<any> {
    const response = await this.client.post('/codebase/analyze', { directory });
    return response.data;
  }
}

export const apiClient = new ApiClient();

// WebSocket client for real-time updates
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_BASE_URL);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('WebSocket message parsing error:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any) {
    // Handle different message types
    switch (data.type) {
      case 'welcome':
        console.log('WebSocket welcome:', data.message);
        break;
      case 'agent_status_update':
        this.notifyAgentStatusUpdate(data);
        break;
      case 'project_update':
        this.notifyProjectUpdate(data);
        break;
      default:
        console.log('Unknown WebSocket message:', data);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(() => {
          // Reconnection failed, will try again
        });
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  subscribe(channel: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
  }

  private notifyAgentStatusUpdate(data: any) {
    // Dispatch custom event for agent status updates
    window.dispatchEvent(new CustomEvent('agentStatusUpdate', {
      detail: data
    }));
  }

  private notifyProjectUpdate(data: any) {
    // Dispatch custom event for project updates
    window.dispatchEvent(new CustomEvent('projectUpdate', {
      detail: data
    }));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();

export default apiClient;