"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { validatePassword } from '../utils/validation';
import { useSupabase } from '../../../providers';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company: string;
}

export function useAuth() {
  const router = useRouter();
  const supabase = useSupabase();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const sessionChecked = useRef(false);
  const previousUserId = useRef<string | null>(null);

  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ?? null;
    } catch (err) {
      console.error('[useAuth] Error getting current user:', err);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (sessionChecked.current) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[useAuth] Error getting session:', error);
          return;
        }
        if (mounted) {
          const newUser = session?.user ?? null;
          setUser(newUser);
          previousUserId.current = newUser?.id ?? null;
          setLoading(false);
          sessionChecked.current = true;
        }
      } catch (err) {
        console.error('[useAuth] Unexpected error getting session:', err);
        if (mounted) {
          setLoading(false);
          sessionChecked.current = true;
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        const newUser = session?.user ?? null;
        const newUserId = newUser?.id ?? null;
        
        // Only update if there's an actual change in the user's auth state
        if (newUserId !== previousUserId.current) {
          setUser(newUser);
          previousUserId.current = newUserId;
          if (_event === 'SIGNED_OUT') {
            router.push('/client-portal/login');
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe
        }
      });

      if (error) throw error;

      // Check if user exists in zen_users
      const { data: userData, error: userError } = await supabase
        .from('zen_users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!userData && !userError) {
        const { error: createUserError } = await supabase
          .from('zen_users')
          .insert([
            {
              id: data.user.id,
              email: email,
              name: email.split('@')[0],
              role: 'client'
            }
          ]);

        if (createUserError) {
          throw new Error('Failed to create user record');
        }
      } else if (userError && userError.code !== 'PGRST116') {
        throw new Error('Failed to verify user status');
      }

      return data;
    } catch (error: any) {
      console.error('[useAuth] Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (data: RegisterData) => {
    if (!validatePassword(data.password)) {
      throw new Error('Password does not meet requirements');
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('zen_users')
        .insert([
          {
            id: authData.user.id,
            email: data.email,
            name: data.name,
            company: data.company,
            role: 'client'
          }
        ]);

      if (profileError) {
        throw new Error('Failed to create user profile');
      }
    }

    return authData;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/client-portal/reset-password`,
    });
    if (error) throw error;
    return { success: true };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    getCurrentUser
  };
}