import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BizDevAgent } from '@/app/ai_agents/agents/BizDevAgent';
import { Database } from '@/app/types/database';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Define a constant UUID for the system agent
const SYSTEM_AGENT_ID = '00000000-0000-0000-0000-000000000000';

// Function to ensure system agent exists
async function ensureSystemAgent() {
  const { data: existingAgent } = await supabase
    .from('zen_agents')
    .select('id')
    .eq('id', SYSTEM_AGENT_ID)
    .single();

  if (!existingAgent) {
    const { error: createError } = await supabase
      .from('zen_agents')
      .insert({
        id: SYSTEM_AGENT_ID,
        name: 'System Agent',
        role: 'system',
        email: 'system@zendesk-clone.local',
        title: 'System Agent',
        department: 'System'
      });

    if (createError) {
      throw new Error('Failed to create system agent: ' + createError.message);
    }
  }
}

export async function POST(req: Request) {
  try {
    const { projectId, messageType, filters, context } = await req.json();

    // Ensure system agent exists
    await ensureSystemAgent();

    // Initialize BizDev agent
    const agent = new BizDevAgent(supabase, SYSTEM_AGENT_ID);

    // Execute batch generation
    const result = await agent.execute('batch_generate_outreach', {
      projectId,
      messageType,
      filters,
      context
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in batch generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate messages' },
      { status: 500 }
    );
  }
} 