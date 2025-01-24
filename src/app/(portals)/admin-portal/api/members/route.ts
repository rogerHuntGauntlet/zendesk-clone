import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  name: string;
}

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  project_id: string;
  project: Project;
}

interface Profile {
  email: string;
  full_name: string | null;
}

interface Client {
  user_id: string;
  company: string;
  profiles: Profile;
}

interface Employee {
  user_id: string;
  department: string;
  profiles: Profile;
}

interface MemberData {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    company: string;
    projects: Project[];
  }>;
  employees: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    projects: Project[];
  }>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('1. Fetching projects for admin:', userId);

    // Get all projects for this admin
    const { data: projects, error: projectsError } = await supabase
      .from('zen_projects')
      .select('id')
      .eq('admin_id', userId);

    if (projectsError) {
      console.error('Projects error:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    console.log('2. Found projects:', projects);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ clients: [], employees: [] });
    }

    const projectIds = projects.map(p => p.id);
    console.log('3. Project IDs:', projectIds);

    // Get all project members
    const { data: members, error: membersError } = await supabase
      .from('zen_project_members')
      .select(`
        id,
        user_id,
        role,
        project_id,
        project:zen_projects!zen_project_members_project_id_fkey(id, name)
      `)
      .in('project_id', projectIds);

    if (membersError) {
      console.error('Members error:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    console.log('4. Found members:', members);

    // Get client details
    const clientUserIds = members
      ?.filter(m => m.role === 'client')
      .map(m => m.user_id) || [];

    console.log('5. Client user IDs:', clientUserIds);

    const { data: clients, error: clientsError } = await supabase
      .from('zen_clients')
      .select(`
        user_id,
        company,
        profiles:profiles!zen_clients_user_id_fkey(
          email,
          full_name
        )
      `)
      .in('user_id', clientUserIds);

    if (clientsError) {
      console.error('Clients error:', clientsError);
      return NextResponse.json(
        { error: 'Failed to fetch client details' },
        { status: 500 }
      );
    }

    console.log('6. Found clients:', clients);

    // Get employee details
    const employeeUserIds = members
      ?.filter(m => m.role === 'employee')
      .map(m => m.user_id) || [];

    console.log('7. Employee user IDs:', employeeUserIds);

    const { data: employees, error: employeesError } = await supabase
      .from('zen_employees')
      .select(`
        user_id,
        department,
        profiles:profiles!zen_employees_user_id_fkey(
          email,
          full_name
        )
      `)
      .in('user_id', employeeUserIds);

    if (employeesError) {
      console.error('Employees error:', employeesError);
      return NextResponse.json(
        { error: 'Failed to fetch employee details' },
        { status: 500 }
      );
    }

    console.log('8. Found employees:', employees);

    // Transform data
    const membersByRole: MemberData = {
      clients: [],
      employees: []
    };

    // Process clients
    for (const client of (clients || [])) {
      if (!client.profiles?.[0]) continue;
      
      const clientProjects = members
        ?.filter(m => m.user_id === client.user_id && m.project)
        .map(m => ({
          id: m.project.id,
          name: m.project.name
        })) || [];

      membersByRole.clients.push({
        id: client.user_id,
        name: client.profiles[0].full_name || 'Unknown User',
        email: client.profiles[0].email,
        company: client.company,
        projects: clientProjects
      });
    }

    // Process employees
    for (const employee of (employees || [])) {
      if (!employee.profiles?.[0]) continue;
      
      const employeeProjects = members
        ?.filter(m => m.user_id === employee.user_id && m.project)
        .map(m => ({
          id: m.project.id,
          name: m.project.name
        })) || [];

      membersByRole.employees.push({
        id: employee.user_id,
        name: employee.profiles[0].full_name || 'Unknown User',
        email: employee.profiles[0].email,
        department: employee.department,
        projects: employeeProjects
      });
    }

    console.log('9. Final response:', membersByRole);

    return NextResponse.json(membersByRole);
  } catch (error) {
    console.error('Unexpected error in GET /api/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 