'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
const supabase = createClient('https://rlaxacnkrfohotpyvnam.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhhY25rcmZvaG90cHl2bmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxOTk3NjcsImV4cCI6MjA1MTc3NTc2N30.djQ3ExBd5Y2wb2sUOZCs5g72U2EgdYte7NqFiLesE9Y', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-rlaxacnkrfohotpyvnam-auth-token',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, value);
        // Also set in a cookie for server-side access
        document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
        // Also remove from cookies
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      },
    },
  }
});

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, role: string) => Promise<void>;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth Context - Initial session check:', session ? 'exists' : 'null');
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth Context - Auth state changed:', _event);
      console.log('Auth Context - New session:', session ? 'exists' : 'null');
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, role: string) => {
    try {
      console.log('Signing in with role:', role);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Sign in error:', error.message);
        // If user doesn't exist, create them
        if (error.message.includes('Invalid login credentials')) {
          await signUp(email, password, role);
          // Try signing in again after creating the account
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
          
          console.log('Auto sign in successful, user:', signInData.user);
          console.log('User metadata:', signInData.user?.user_metadata);
          setUser(signInData.user);
          return;
        }
        throw error;
      }

      // Update user metadata with role if it's not set
      if (!data.user.user_metadata?.role) {
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          data: { role }
        });
        if (updateError) throw updateError;
        console.log('Updated user metadata:', updateData.user.user_metadata);
        setUser(updateData.user);
      } else {
        // Verify the user is logging in through the correct portal
        if (data.user.user_metadata.role !== role) {
          throw new Error(`Please use the ${data.user.user_metadata.role.replace('_', ' ')} login portal`);
        }
        console.log('Sign in successful, user:', data.user);
        console.log('User metadata:', data.user?.user_metadata);
        setUser(data.user);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, role: string) => {
    try {
      console.log('Signing up new user with role:', role);
      // 1. Sign up the user with role in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');

      console.log('Sign up successful, user:', data.user);
      console.log('User metadata:', data.user.user_metadata);

      // 2. Insert into role-specific table
      const { error: roleError } = await supabase
        .from(`zen_${role}s`.replace('project_', ''))
        .insert([{ user_id: data.user.id }]);

      if (roleError) {
        // Cleanup: delete auth user if role table insertion fails
        await supabase.auth.admin.deleteUser(data.user.id);
        throw roleError;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword,
      updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 