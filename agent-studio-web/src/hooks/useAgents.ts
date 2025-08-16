import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Agent } from '../services/api';

export function useAgents(params?: {
  status?: string;
  type?: string;
  projectId?: string;
}) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => apiClient.getAgents(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => apiClient.getAgent(id),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      type: string;
      description?: string;
      systemPrompt?: string;
      configuration?: any;
    }) => apiClient.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) => 
      apiClient.updateAgent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', id] });
    },
  });
}

export function useStartAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.startAgent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', id] });
    },
  });
}

export function useStopAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.stopAgent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', id] });
    },
  });
}

export function useChatWithAgent() {
  return useMutation({
    mutationFn: ({ 
      id, 
      message, 
      conversationId 
    }: { 
      id: string; 
      message: string; 
      conversationId?: string; 
    }) => apiClient.chatWithAgent(id, message, conversationId),
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}