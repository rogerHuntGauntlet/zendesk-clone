import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/database';
import { BizDevAgent } from '@/app/ai_agents/agents/BizDevAgent';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Define a constant UUID for the system agent
const SYSTEM_AGENT_ID = '00000000-0000-0000-0000-000000000000';

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

    // Get sequence details
    const { data: sequence, error: sequenceError } = await supabase
      .from('zen_outreach_sequences')
      .select('*')
      .eq('id', sequenceId)
      .single();

    if (sequenceError || !sequence) {
      throw new Error('Sequence not found');
    }

    // Initialize BizDev agent
    const agent = new BizDevAgent(supabase, SYSTEM_AGENT_ID);

    // Execute sequence
    const result = await agent.execute('batch_generate_outreach', {
      projectId,
      messageType: sequence.steps[0].messageType,
      filters: {
        status: 'new',
        category: 'prospect'
      },
      context: {
        tone: sequence.steps[0].tone,
        customFields: {
          sequenceId,
          stepId: sequence.steps[0].id,
          template: sequence.steps[0].template
        }
      }
    });

    // Update sequence status
    const { data: updatedSequence, error: updateError } = await supabase
      .from('zen_outreach_sequences')
      .update({
        isActive: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', sequenceId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create sequence execution record
    const { error: executionError } = await supabase
      .from('zen_sequence_executions')
      .insert({
        sequenceId,
        projectId,
        status: 'active',
        currentStep: 0,
        startedAt: new Date().toISOString(),
        nextMessageDue: new Date(Date.now() + sequence.steps[0].delayDays * 86400000).toISOString(),
        completedSteps: []
      });

    if (executionError) throw executionError;

    return NextResponse.json({
      ...updatedSequence,
      executionResult: result
    });
  } catch (error) {
    console.error('Error executing sequence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute sequence' },
      { status: 500 }
    );
  }
} 