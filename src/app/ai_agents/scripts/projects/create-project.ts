import { getServiceClient, handleDatabaseError, validateEnvironment } from '../../utils/supabase';
import { validateProject } from '../../utils/validation';
import { ZenProject } from '../../types/database';

export async function createProject(projectData: Partial<ZenProject>) {
  try {
    // Validate environment
    validateEnvironment();

    // Validate project data
    const errors = validateProject(projectData);
    if (errors.length > 0) {
      console.error('Project validation failed:');
      errors.forEach(error => console.error(`- ${error}`));
      throw new Error('Invalid project data');
    }

    // Get database client
    const supabase = getServiceClient();

    // Create project
    console.log('Creating project:', projectData.name);
    const { data: project, error: projectError } = await supabase
      .from('zen_projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      handleDatabaseError(projectError, 'project creation');
    }

    console.log('Project created successfully:', project.id);
    return project;

  } catch (error: any) {
    handleDatabaseError(error, 'createProject');
    throw error;
  }
}

// Example usage:
/*
import { createProject } from './create-project';

const projectData = {
  name: 'VR Quest: Technical Support Hub',
  description: 'Virtual Reality game development studio technical support...',
  status: 'active' as const,
  priority: 'high' as const,
  category: 'Technical Support',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  tags: ['VR', 'Game Development', 'Unity3D']
};

createProject(projectData)
  .then(project => console.log('Created project:', project))
  .catch(error => console.error('Failed to create project:', error));
*/
