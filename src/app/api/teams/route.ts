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

    // Validate required fields
    if (!name || !focusArea || !teamLeadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new team
    const { data: team, error } = await supabase
      .from('zen_teams')
      .insert([
        {
          name,
          description,
          focus_area: focusArea,
          team_lead_id: teamLeadId,
        },
      ])
      .select('*, team_lead:zen_teams_team_lead_id_fkey(id, name, email)')
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error in teams POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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