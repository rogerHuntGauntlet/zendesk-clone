import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectIds, action, status } = await request.json();

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json({ error: 'Invalid project IDs' }, { status: 400 });
    }

    if (action === 'archive') {
      // Archive projects
      await db.query(
        `UPDATE zen_projects 
         SET status = 'archived', 
             updated_at = NOW() 
         WHERE id = ANY($1::uuid[])`,
        [projectIds]
      );
    } else if (action === 'update_status' && status) {
      // Update project status
      await db.query(
        `UPDATE zen_projects 
         SET status = $1, 
             updated_at = NOW() 
         WHERE id = ANY($2::uuid[])`,
        [status, projectIds]
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Return updated projects
    const { rows: updatedProjects } = await db.query(
      `SELECT * FROM zen_projects WHERE id = ANY($1::uuid[])`,
      [projectIds]
    );

    return NextResponse.json(updatedProjects);
  } catch (error) {
    console.error('Error in bulk project update:', error);
    return NextResponse.json(
      { error: 'Failed to update projects' },
      { status: 500 }
    );
  }
} 