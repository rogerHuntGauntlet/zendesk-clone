import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { initializeMockData } from '@/lib/mock-data-init';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isDemo: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isDemo: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Initialize mock data for both demo and real usage
        initializeMockData();
        
        // Try to get the current user
        const user = await api.getCurrentUser();
        
        if (user) {
          // User is authenticated
          setState({
            user,
            isLoading: false,
            isDemo: false,
          });
        } else {
          // No authenticated user - use demo mode
          setState({
            user: {
              id: 'demo-client',
              email: 'demo@example.com',
              name: 'Demo User',
              role: 'client',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            },
            isLoading: false,
            isDemo: true,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, fallback to demo mode
        setState({
          user: {
            id: 'demo-client',
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'client',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          },
          isLoading: false,
          isDemo: true,
        });
      }
    };

    checkAuth();
  }, []);

  return state;
} 