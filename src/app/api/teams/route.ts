export const runtime = 'edge';

import { createClient } from '../../../lib/supabase/server';
import { NextResponse } from 'next/server';

interface Team {
  id: string;
  name: string;
  description: string | null;
  focus_area: string;
  team_lead_id: string;
  created_at: string;
  updated_at: string;
  team_lead: {
    id: string;
    name: string;
    email: string;
  };
  team_members?: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const body = await req.json();
    const { name, description, focusArea, teamLeadId } = body;

    console.log('Received request body:', body);

    // Validate required fields
    if (!name || !focusArea || !teamLeadId) {
      console.log('Missing required fields:', { name, focusArea, teamLeadId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First verify that the team lead exists
    const { data: teamLead, error: teamLeadError } = await supabase
      .from('zen_users')
      .select('id, name, email')
      .eq('id', teamLeadId)
      .single();

    if (teamLeadError || !teamLead) {
      console.error('Error verifying team lead:', teamLeadError);
      return NextResponse.json(
        { error: 'Invalid team lead ID' },
        { status: 400 }
      );
    }

    console.log('Creating team with data:', {
      name,
      description,
      focus_area: focusArea,
      team_lead_id: teamLeadId
    });

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('zen_teams')
      .insert([
        {
          name,
          description,
          focus_area: focusArea,
          team_lead_id: teamLeadId,
        },
      ])
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json(
        { error: `Failed to create team: ${teamError.message}` },
        { status: 500 }
      );
    }

    console.log('Team created successfully:', team);

    // Add the team lead as a team member
    const { error: memberError } = await supabase
      .from('zen_team_members')
      .insert([
        {
          team_id: team.id,
          user_id: teamLeadId,
          role: 'team_lead',
        },
      ]);

    if (memberError) {
      console.error('Error adding team lead as member:', memberError);
      // Try to clean up the team if member creation fails
      const { error: deleteError } = await supabase
        .from('zen_teams')
        .delete()
        .eq('id', team.id);
      
      if (deleteError) {
        console.error('Error cleaning up team after member creation failed:', deleteError);
      }

      return NextResponse.json(
        { error: `Failed to add team lead as member: ${memberError.message}` },
        { status: 500 }
      );
    }

    console.log('Team member created successfully');

    // Fetch the complete team data with team lead info
    const { data: completeTeam, error: fetchError } = await supabase
      .from('zen_teams')
      .select(`
        *,
        team_lead:zen_users!zen_teams_team_lead_id_fkey(id, name, email),
        team_members:zen_team_members(
          id,
          role,
          user:zen_users(id, name, email)
        )
      `)
      .eq('id', team.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete team:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch complete team: ${fetchError.message}` },
        { status: 500 }
      );
    }

    console.log('Successfully fetched complete team data:', completeTeam);
    return NextResponse.json(completeTeam);
  } catch (error) {
    console.error('Error in teams POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const supabase = createClient();

    const { data: teams, error } = await supabase
      .from('zen_teams')
      .select(`
        *,
        team_lead:zen_teams_team_lead_id_fkey(id, name, email),
        team_members:zen_team_members_team_id_fkey(
          id,
          role,
          user:zen_team_members_user_id_fkey(id, name, email)
        )
      `);

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }

    // Transform the data to match the Team interface
    const transformedTeams = (teams as Team[]).map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      focusArea: team.focus_area,
      teamLead: team.team_lead,
      memberCount: team.team_members?.length || 0
    }));

    return NextResponse.json(transformedTeams);
  } catch (error) {
    console.error('Error in teams GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 