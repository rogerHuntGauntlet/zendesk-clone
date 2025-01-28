import { getServiceClient, handleDatabaseError, validateEnvironment } from '../../utils/supabase';
import { validateUser, validatePassword } from '../../utils/validation';
import { ZenUser, ZenClient, ZenEmployee } from '../../types/database';

interface CreateUserParams {
  email: string;
  password: string;
  userData: Partial<ZenUser>;
  clientData?: Partial<ZenClient>;
  employeeData?: Partial<ZenEmployee>;
}

export async function createUser({
  email,
  password,
  userData,
  clientData,
  employeeData
}: CreateUserParams) {
  try {
    // Validate environment
    validateEnvironment();

    // Validate user data
    const errors = validateUser(userData);
    if (!validatePassword(password)) {
      errors.push('Invalid password format');
    }
    
    if (errors.length > 0) {
      console.error('User validation failed:');
      errors.forEach(error => console.error(`- ${error}`));
      throw new Error('Invalid user data');
    }

    // Get database client
    const supabase = getServiceClient();

    // Create auth user
    console.log(`Creating auth user: ${email}`);
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      handleDatabaseError(authError, 'auth user creation');
    }

    // Create zen_users entry
    console.log(`Creating zen_users entry for: ${email}`);
    const { error: userError } = await supabase
      .from('zen_users')
      .insert({
        id: authUser.user.id,
        ...userData
      });

    if (userError) {
      handleDatabaseError(userError, 'zen_users creation');
    }

    // Create role-specific entry
    if (userData.role === 'client' && clientData) {
      console.log(`Creating client entry for: ${email}`);
      const { error: clientError } = await supabase
        .from('zen_clients')
        .insert({
          user_id: authUser.user.id,
          ...clientData
        });

      if (clientError) {
        handleDatabaseError(clientError, 'zen_clients creation');
      }
    }

    if (userData.role === 'employee' && employeeData) {
      console.log(`Creating employee entry for: ${email}`);
      const { error: employeeError } = await supabase
        .from('zen_employees')
        .insert({
          user_id: authUser.user.id,
          ...employeeData
        });

      if (employeeError) {
        handleDatabaseError(employeeError, 'zen_employees creation');
      }
    }

    console.log(`User ${email} created successfully`);
    return authUser.user;

  } catch (error: any) {
    handleDatabaseError(error, 'createUser');
    throw error;
  }
}

// Example usage:
/*
import { createUser } from './create-user';

const userData = {
  email: 'sarah.chen@vrquest.dev',
  password: 'VRQuest2025!',
  userData: {
    name: 'Sarah Chen',
    role: 'client' as const,
    department: 'Development',
    title: 'Lead VR Developer'
  },
  clientData: {
    company: 'VR Quest Studios',
    projects: ['project-id']
  }
};

createUser(userData)
  .then(user => console.log('Created user:', user))
  .catch(error => console.error('Failed to create user:', error));
*/
