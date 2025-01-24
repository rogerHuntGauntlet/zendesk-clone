import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RegisterData {
  email: string;
  password: string;
  name: string;
  department?: string;
}

export function useAuth() {
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
            role: 'employee'
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
          role: 'employee',
          department: formData.department,
        },
      },
    });

    if (error) throw error;

    // Create employee record
    const { error: employeeError } = await supabase
      .from('zen_employees')
      .insert([
        {
          user_id: data.user?.id,
          department: formData.department,
          status: 'active',
        },
      ]);

    if (employeeError) throw employeeError;

    return data;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/employee-portal/reset-password`,
    });

    if (error) throw error;
  };

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    signIn,
    signUp,
    resetPassword,
    getCurrentUser,
    signOut,
  };
} 