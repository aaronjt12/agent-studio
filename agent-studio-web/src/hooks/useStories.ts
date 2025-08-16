import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Story } from '../services/api';

export function useStories(params?: {
  projectId?: string;
  status?: string;
  priority?: string;
  assignedAgentId?: string;
}) {
  return useQuery({
    queryKey: ['stories', params],
    queryFn: () => apiClient.getStories(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useStory(id: string) {
  return useQuery({
    queryKey: ['stories', id],
    queryFn: () => apiClient.getStory(id),
    enabled: !!id,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      projectId: string;
      priority?: string;
      storyPoints?: number;
      status?: string;
    }) => apiClient.createStory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useGenerateStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      requirements: string;
      projectId: string;
      agentId?: string;
    }) => apiClient.generateStory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Story> }) => 
      apiClient.updateStory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['stories', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useAssignAgentToStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      storyId, 
      agentId, 
      role 
    }: { 
      storyId: string; 
      agentId: string; 
      role?: string; 
    }) => apiClient.assignAgentToStory(storyId, agentId, role),
    onSuccess: (_, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['stories', storyId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useRemoveAgentFromStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      storyId, 
      agentId 
    }: { 
      storyId: string; 
      agentId: string; 
    }) => apiClient.removeAgentFromStory(storyId, agentId),
    onSuccess: (_, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['stories', storyId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}