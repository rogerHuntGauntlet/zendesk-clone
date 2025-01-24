"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/auth-config';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  department?: string;
}

export function useAuth() {
  const router = useRouter();
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
            role: 'admin'
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
          role: 'admin',
          department: formData.department,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // Create admin record
    const { error: adminError } = await supabase
      .from('zen_admins')
      .insert([
        {
          user_id: data.user?.id,
          permissions: ['basic_admin'],
          managed_departments: formData.department ? [formData.department] : [],
        },
      ]);

    if (adminError) {
      // If admin record creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(data.user!.id);
      throw adminError;
    }

    return data;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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
    router.push('/admin-portal/login');
  };

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    getCurrentUser,
    resetPassword,
    updatePassword,
  };
}