import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Project } from '../services/api';

export function useProjects(params?: {
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => apiClient.getProjects(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiClient.getProject(id),
    enabled: !!id,
  });
}

export function useProjectDashboard(id: string) {
  return useQuery({
    queryKey: ['projects', id, 'dashboard'],
    queryFn: () => apiClient.getProjectDashboard(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      status?: string;
    }) => apiClient.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => 
      apiClient.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

export function useAddAgentToProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      projectId, 
      agentId, 
      role 
    }: { 
      projectId: string; 
      agentId: string; 
      role?: string; 
    }) => apiClient.addAgentToProject(projectId, agentId, role),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useRemoveAgentFromProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      projectId, 
      agentId 
    }: { 
      projectId: string; 
      agentId: string; 
    }) => apiClient.removeAgentFromProject(projectId, agentId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}