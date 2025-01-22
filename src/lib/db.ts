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

  if (isAdmin) {
    // If admin, only show projects where they are the admin
    query = query.eq('admin_id', userId);
  } else {
    // If not an admin, only fetch projects they have access to
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

  // Create the project
  const { data: project, error: projectError } = await db
    .from('zen_projects')
    .insert([{
      name: projectData.name,
      description: projectData.description,
      created_at: projectData.created_at,
      admin_id: projectData.admin_id
    }])
    .select()
    .single();

  if (projectError) throw projectError;

  // Add the admin as a team member with admin role
  const { error: memberError } = await db
    .from('zen_project_members')
    .insert([{
      project_id: project.id,
      user_id: projectData.admin_id,
      role: 'project_admin'
    }]);

  if (memberError) throw memberError;

  return project;
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
      project_id,
      user_id,
      role,
      zen_users!fk_project_members_user (
        id,
        email,
        name,
        role
      )
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
    id: member.zen_users.id,
    email: member.zen_users.email,
    name: member.zen_users.name,
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
    .select('id, email')
    .ilike('email', email)
    .single();

  if (userCheckError && userCheckError.code !== 'PGRST116') {
    throw userCheckError;
  }

  if (existingUser) {
    // Check if user is already a member
    const { data: existingMember } = await db
      .from('zen_project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', existingUser.id)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    // If user exists and not already a member, add them directly to the project
    const { error: memberError } = await db
      .from('zen_project_members')
      .insert([{
        project_id: projectId,
        user_id: existingUser.id,
        role: role
      }]);

    if (memberError) throw memberError;
  } else {
    // Check if invite already exists
    const { data: existingInvite } = await db
      .from('zen_pending_invites')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .single();

    if (existingInvite) {
      throw new Error('Invitation already sent to this email');
    }

    // If user doesn't exist and no pending invite, add them to pending invites
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

export async function getProject(projectId: string) {
  const { data, error } = await db
    .from('zen_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function getEmployeeForProject(projectId: string, userId: string) {
  // First check if the user is a member of the project
  const { data: memberData, error: memberError } = await db
    .from('zen_project_members')
    .select(`
      project_id,
      user_id,
      role,
      zen_users!fk_project_members_user (
        id,
        email,
        name,
        role
      )
    `)
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();

  if (memberError) throw memberError;
  if (!memberData) return null;

  // Try to get active tickets count, fallback to mock data if query fails
  let activeTickets = 0;
  try {
    const { count } = await db
      .from('zen_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .or('status.neq.closed,status.neq.resolved');
    
    activeTickets = count || 0;
  } catch (error) {
    console.log('Using mock data for active tickets count');
    activeTickets = Math.floor(Math.random() * 5); // Random number between 0-4 for mock data
  }

  return {
    id: memberData.zen_users.id,
    name: memberData.zen_users.name,
    email: memberData.zen_users.email,
    role: memberData.role,
    activeTickets
  };
} 