import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
export const db = createClient('https://rlaxacnkrfohotpyvnam.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Project operations
export async function getProjects(userId: string, isAdmin: boolean) {
  let query = db.from('projects').select('*');

  // If not an admin, only fetch projects they have access to
  if (!isAdmin) {
    const { data: memberProjects } = await db
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    if (memberProjects) {
      const projectIds = memberProjects.map(p => p.project_id);
      query = query.in('id', projectIds);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createProject(projectData: any) {
  const { data, error } = await db
    .from('projects')
    .insert([projectData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(projectId: string, updates: any) {
  const { data, error } = await db
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId: string) {
  const { error } = await db
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}

export async function archiveProject(projectId: string) {
  const { data, error } = await db
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Team member operations
export async function getTeamMembers(projectId: string) {
  const { data, error } = await db
    .from('project_members')
    .select(`
      *,
      user:users (
        id,
        email,
        user_metadata
      )
    `)
    .eq('project_id', projectId);

  if (error) throw error;
  return data;
}

export async function addTeamMember(projectId: string, userId: string, role: string) {
  const { data, error } = await db
    .from('project_members')
    .insert([{
      project_id: projectId,
      user_id: userId,
      role: role
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeTeamMember(projectId: string, userId: string) {
  const { error } = await db
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateTeamMember(projectId: string, userId: string, updates: any) {
  const { data, error } = await db
    .from('project_members')
    .update(updates)
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
} 