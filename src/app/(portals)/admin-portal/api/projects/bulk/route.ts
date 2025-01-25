import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { projectIds, action } = body;

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: 'Project IDs array is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let updateData = {};
    switch (action) {
      case 'archive':
        updateData = { status: 'archived' };
        break;
      case 'activate':
        updateData = { status: 'active' };
        break;
      case 'complete':
        updateData = { status: 'completed' };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from('zen_projects')
      .update(updateData)
      .in('id', projectIds)
      .select();

    if (error) {
      console.error('Error updating projects:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: `Successfully ${action}d ${data.length} projects`,
      updatedProjects: data 
    });
  } catch (error) {
    console.error('Error in bulk project update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}