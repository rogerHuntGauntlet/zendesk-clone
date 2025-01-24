import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, created_by } = body;

    console.log('Creating project with data:', { name, description, created_by });

    // Validate required fields
    if (!name || !description || !created_by) {
      console.log('Missing required fields:', { name, description, created_by });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new project with snake_case column names to match database
    const { data, error } = await supabase
      .from('zen_projects')
      .insert([
        {
          name,
          description,
          admin_id: created_by,
          active_tickets: 0,
          client_count: 0,
          employee_count: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: 'zen_projects',
        attempted_columns: ['name', 'description', 'admin_id', 'active_tickets', 'client_count', 'employee_count']
      });
      return NextResponse.json(
        { error: error.message || 'Failed to create project' },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('No data returned from Supabase after insert');
      return NextResponse.json(
        { error: 'Failed to create project - no data returned' },
        { status: 500 }
      );
    }

    console.log('Successfully created project:', data);

    // Transform the response to match our Project interface
    const formattedProject = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      ticketCount: data.active_tickets || 0,
      active_tickets: data.active_tickets || 0,
      status: 'active',
      created_by: data.admin_id,
      clientCount: data.client_count || 0,
      employeeCount: data.employee_count || 0,
      createdAt: data.created_at
    };

    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error('Detailed error in POST /admin-portal/api/projects:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

interface ProjectMember {
  role: string;
}

interface ProjectWithMembers {
  id: string;
  name: string;
  description: string | null;
  active_tickets: number;
  status: "active" | "completed" | "on-hold";
  admin_id: string;
  created_at: string;
  members: ProjectMember[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('GET /admin-portal/api/projects - Request received:', { userId });

    if (!userId) {
      console.log('GET /admin-portal/api/projects - Missing userId');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('GET /admin-portal/api/projects - Fetching projects for user:', userId);

    // First, get all projects where the user is an admin
    const { data: projects, error: projectsError } = await supabase
      .from('zen_projects')
      .select(`
        id,
        name,
        description,
        client_count,
        employee_count,
        active_tickets,
        admin_id,
        created_at
      `)
      .eq('admin_id', userId);

    if (projectsError) {
      console.error('GET /admin-portal/api/projects - Supabase error:', {
        error: projectsError,
        message: projectsError.message,
        details: projectsError.details,
        hint: projectsError.hint
      });
      return NextResponse.json(
        { error: projectsError.message || 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      console.log('GET /admin-portal/api/projects - No projects found for user:', userId);
      return NextResponse.json([]);
    }

    // Then, get all member counts for these projects
    const projectIds = projects.map(p => p.id);
    const { data: members, error: membersError } = await supabase
      .from('zen_project_members')
      .select('project_id, role')
      .in('project_id', projectIds);

    if (membersError) {
      console.error('GET /admin-portal/api/projects - Error fetching members:', membersError);
      return NextResponse.json(
        { error: membersError.message || 'Failed to fetch project members' },
        { status: 500 }
      );
    }

    // Create a map of project_id to member counts
    const memberCounts = members?.reduce((acc: { [key: string]: { employees: number, clients: number } }, member) => {
      if (!acc[member.project_id]) {
        acc[member.project_id] = { employees: 0, clients: 0 };
      }
      if (member.role === 'client') {
        acc[member.project_id].clients++;
      } else {
        acc[member.project_id].employees++;
      }
      return acc;
    }, {}) || {};

    // Transform the projects data with member counts
    const transformedProjects = projects.map(project => {
      const counts = memberCounts[project.id] || { employees: 0, clients: 0 };
      
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        ticketCount: project.active_tickets || 0,
        active_tickets: project.active_tickets || 0,
        status: 'active',
        created_by: project.admin_id,
        clientCount: counts.clients,
        employeeCount: counts.employees,
        createdAt: project.created_at
      };
    });

    console.log('GET /admin-portal/api/projects - Transformed projects:', transformedProjects);

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('GET /admin-portal/api/projects - Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 