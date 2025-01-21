import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
export const db = createClient('https://rlaxacnkrfohotpyvnam.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhhY25rcmZvaG90cHl2bmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxOTk3NjcsImV4cCI6MjA1MTc3NTc2N30.djQ3ExBd5Y2wb2sUOZCs5g72U2EgdYte7NqFiLesE9Y', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Project operations
export async function getProjects(userId: string, isAdmin: boolean) {
  let query = db.from('zen_projects').select('*');

  // If not an admin, only fetch projects they have access to
  if (!isAdmin) {
    const { data: memberProjects } = await db
      .from('zen_project_members')
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
  // First ensure the user exists in zen_users table
  const { data: existingUser, error: userCheckError } = await db
    .from('zen_users')
    .select('id')
    .eq('id', projectData.admin_id)
    .single();

  if (!existingUser) {
    // Insert the user into zen_users table using the data we already have
    const { error: insertError } = await db
      .from('zen_users')
      .insert([{
        id: projectData.admin_id,
        email: projectData.admin_email || '',
        name: projectData.admin_name || projectData.admin_email || projectData.admin_id,
        role: 'project_admin'
      }]);
    
    if (insertError) throw insertError;
  }

  // Now create the project
  const { data, error } = await db
    .from('zen_projects')
    .insert([{
      name: projectData.name,
      description: projectData.description,
      created_at: projectData.created_at,
      admin_id: projectData.admin_id
    }])
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

interface DbTeamMember {
  project_id: string;
  user_id: string;
  role: string;
  zen_users: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface DbPendingInvite {
  id: string;
  email: string;
  project_id: string;
  role: string;
  status: string;
}

export async function getTeamMembers(projectId: string) {
  // Get active team members by joining with zen_users table
  const { data: members, error: membersError } = await db
    .from('zen_project_members')
    .select(`
      zen_project_members.project_id,
      zen_project_members.user_id,
      zen_project_members.role,
      users:zen_users(id, email, name, role)
    `)
    .eq('project_id', projectId);

  if (membersError) throw membersError;

  // Get pending invites
  const { data: pendingInvites, error: invitesError } = await db
    .from('zen_pending_invites')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'pending');

  if (invitesError) throw invitesError;

  // Transform the data into a consistent format
  const activeMembers = (members || []).map((member: any) => ({
    id: member.users.id,
    email: member.users.email,
    name: member.users.name,
    role: member.role,
    status: 'active' as const
  }));

  const pendingMembers = (pendingInvites || []).map((invite: any) => ({
    id: invite.id,
    email: invite.email,
    name: invite.email.split('@')[0],
    role: invite.role,
    status: 'pending' as const
  }));

  return [...activeMembers, ...pendingMembers];
}

export async function addTeamMember(projectId: string, email: string, role: string) {
  // First check if the user exists in zen_users table
  const { data: existingUser, error: userCheckError } = await db
    .from('zen_users')
    .select('id')
    .eq('email', email)
    .single();

  if (userCheckError && userCheckError.code !== 'PGRST116') {
    throw userCheckError;
  }

  if (existingUser) {
    // If user exists, add them directly to the project
    const { error: memberError } = await db
      .from('zen_project_members')
      .insert([{
        project_id: projectId,
        user_id: existingUser.id,
        role: role
      }]);

    if (memberError) throw memberError;
  } else {
    // If user doesn't exist, add them to pending invites
    const { error: inviteError } = await db
      .from('zen_pending_invites')
      .insert([{
        email: email,
        project_id: projectId,
        role: role,
        status: 'pending'
      }]);

    if (inviteError) throw inviteError;
  }
}

export async function bulkAddTeamMembers(projectId: string, emails: string[], role: string) {
  const results = [];
  const errors = [];

  for (const email of emails) {
    try {
      await addTeamMember(projectId, email, role);
      results.push({ email, success: true });
    } catch (err) {
      const error = err as Error;
      errors.push({ email, error: error.message });
    }
  }

  return { results, errors };
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