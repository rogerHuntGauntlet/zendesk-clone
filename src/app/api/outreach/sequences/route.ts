import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/database';
import { OutreachSequence } from '@/app/types/outreach';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const { data: sequences, error } = await supabase
      .from('zen_outreach_sequences')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(sequences);
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { projectId, sequence } = await req.json();

    if (!projectId || !sequence) {
      return NextResponse.json(
        { error: 'Project ID and sequence data are required' },
        { status: 400 }
      );
    }

    const { data: newSequence, error } = await supabase
      .from('zen_outreach_sequences')
      .insert({
        ...sequence,
        project_id: projectId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newSequence);
  } catch (error) {
    console.error('Error creating sequence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sequence' },
      { status: 500 }
    );
  }
} 