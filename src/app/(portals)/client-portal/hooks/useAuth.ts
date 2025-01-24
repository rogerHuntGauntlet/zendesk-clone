"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { validatePassword } from '../utils/validation';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company: string;
}

export function useAuth() {
  const router = useRouter();
  const supabase = createClientComponentClient({
    options: {
      cookieOptions: {
        name: "sb-client-auth",
        path: "/client-portal"
      }
    }
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if user exists in zen_users
    const { data: userData, error: userError } = await supabase
      .from('zen_users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // If user doesn't exist in zen_users, create them
    if (!userData && !userError) {
      const { error: createUserError } = await supabase
        .from('zen_users')
        .insert([
          {
            id: data.user.id,
            email: email,
            name: email.split('@')[0], // Default name from email
            role: 'client'
          }
        ]);

      if (createUserError) {
        console.error('Error creating user record:', createUserError);
        throw new Error('Failed to create user record');
      }
    } else if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user status:', userError);
      throw new Error('Failed to verify user status');
    }

    return data;
  };

  const signUp = async (formData: RegisterData) => {
    const { data: existingUser } = await supabase
      .from('zen_users')
      .select('id')
      .eq('email', formData.email)
      .single();

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          role: 'client',
        },
        emailRedirectTo: `${window.location.origin}/client-portal/login`,
      },
    });

    if (error) throw error;

    // Create client record
    const { error: clientError } = await supabase
      .from('zen_clients')
      .insert([
        {
          user_id: data.user?.id,
          company: formData.company,
          plan: 'standard',
          total_tickets: 0,
          active_tickets: 0,
        },
      ]);

    if (clientError) {
      // If client record creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(data.user!.id);
      throw clientError;
    }

    return data;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/client-portal/reset-password`,
    });

    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/client-portal/login');
  };

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    user,
    loading,
  };
}