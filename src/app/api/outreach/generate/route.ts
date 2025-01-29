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
  const encoder = new TextEncoder();
  const { ticketId, prompt, messageType } = await req.json();

  // Create a TransformStream for streaming the response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Function to send updates to the client
  const sendUpdate = async (data: any) => {
    await writer.write(
      encoder.encode(JSON.stringify(data) + '\n')
    );
  };

  // Start the generation process
  (async () => {
    try {
      // Step 1: Initialize
      await sendUpdate({
        step: 'Initializing AI agent...',
      });

      await ensureSystemAgent();
      const agent = new BizDevAgent(supabase, SYSTEM_AGENT_ID);

      // Step 2: Validate ticket
      await sendUpdate({
        step: 'Validating ticket information...',
      });

      // Step 3: Analyze context
      await sendUpdate({
        step: 'Analyzing prospect and project context...',
      });

      // Generate the outreach message with streaming updates
      const result = await agent.execute('generate_outreach', {
        ticketId,
        messageType: 'initial',
        context: {
          tone: 'formal',
          customFields: {
            prompt,
            trackingEnabled: true
          }
        }
      });

      // Step 4: Stream the generated content
      if (result.message) {
        // Split the message into sentences for streaming
        const sentences = result.message.split(/(?<=[.!?])\s+/);
        
        // Stream each sentence with a small delay
        for (let i = 0; i < sentences.length; i++) {
          await sendUpdate({
            step: `Generating message (${Math.round(((i + 1) / sentences.length) * 100)}%)...`,
            content: sentences.slice(0, i + 1).join(' ')
          });
          // Small delay between sentences for natural streaming effect
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Step 5: Final message with metadata
      await sendUpdate({
        step: 'Finalizing...',
        content: result.message,
        metadata: result.metadata
      });

      // Close the stream
      await writer.close();

    } catch (error) {
      console.error('Error generating outreach:', error);
      
      let errorMessage = 'Failed to generate message';
      
      if (error instanceof Error) {
        if (error.message === 'Agent validation failed') {
          errorMessage = 'The AI agent is not properly configured. Please contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      await sendUpdate({
        error: errorMessage
      });
      await writer.close();
    }
  })();

  // Return the readable stream
  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 