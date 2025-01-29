import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/database';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { projectId } = await req.json();
    const sequenceId = params.id;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Update sequence status
    const { data: updatedSequence, error: updateError } = await supabase
      .from('zen_outreach_sequences')
      .update({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', sequenceId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update execution status
    const { error: executionError } = await supabase
      .from('zen_sequence_executions')
      .update({
        status: 'paused',
        updatedAt: new Date().toISOString()
      })
      .eq('sequenceId', sequenceId)
      .eq('status', 'active');

    if (executionError) throw executionError;

    return NextResponse.json(updatedSequence);
  } catch (error) {
    console.error('Error pausing sequence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to pause sequence' },
      { status: 500 }
    );
  }
} 