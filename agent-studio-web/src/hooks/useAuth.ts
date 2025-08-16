import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, authStorage } from '../services/api';
import type { User } from '../services/api';
import { useState, useEffect } from 'react';

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStorage.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!authStorage.getToken());
  const queryClient = useQueryClient();

  // Check authentication status on mount
  useEffect(() => {
    const token = authStorage.getToken();
    const savedUser = authStorage.getUser();
    
    if (token && savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
      
      // Verify token is still valid
      apiClient.getMe().then(({ user }) => {
        authStorage.setUser(user);
        setUser(user);
      }).catch(() => {
        // Token invalid, clear auth
        logout();
      });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => apiClient.login(credentials),
    onSuccess: ({ user, token }) => {
      authStorage.setToken(token);
      authStorage.setUser(user);
      setUser(user);
      setIsAuthenticated(true);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Login failed:', error);
    }
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => apiClient.register(credentials),
    onSuccess: ({ user, token }) => {
      authStorage.setToken(token);
      authStorage.setUser(user);
      setUser(user);
      setIsAuthenticated(true);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSettled: () => {
      // Clear auth regardless of API call success
      logout();
    }
  });

  const logout = () => {
    authStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: () => logoutMutation.mutate(),
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}