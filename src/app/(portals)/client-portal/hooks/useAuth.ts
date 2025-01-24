"use client";

import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { validatePassword } from '../utils/validation';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company: string;
}

export const useAuth = () => {
  const router = useRouter();
  const supabase = createClient();
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

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Check if email is verified
    if (data.user && !data.user.email_confirmed_at) {
      throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
    }

    return data;
  };

  const signUp = async (registerData: RegisterData) => {
    // Validate password
    const { isValid, errors } = validatePassword(registerData.password);
    if (!isValid) {
      throw new Error(errors.join('\n'));
    }

    const { data: existingClient } = await supabase
      .from('zen_clients')
      .select('*')
      .eq('company', registerData.company)
      .single();

    if (existingClient) {
      throw new Error('A client with this company name already exists');
    }

    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        data: {
          name: registerData.name,
          role: 'client',
        },
        emailRedirectTo: `${window.location.origin}/client-portal`,
      },
    });

    if (error) throw error;

    // Create client record
    if (data.user) {
      const { error: clientError } = await supabase
        .from('zen_clients')
        .insert([
          {
            user_id: data.user.id,
            company: registerData.company,
            plan: 'standard',
            total_tickets: 0,
            active_tickets: 0,
          },
        ]);

      if (clientError) {
        // If client record creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        throw clientError;
      }
    }

    return data;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/client-portal/reset-password`,
    });
    
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    // Validate new password
    const { isValid, errors } = validatePassword(newPassword);
    if (!isValid) {
      throw new Error(errors.join('\n'));
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/client-portal/login');
  };

  // Add function to check if user is in an active session
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/client-portal/login');
      return false;
    }
    return true;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    checkSession,
  };
}; 