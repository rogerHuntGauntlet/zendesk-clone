import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/app/types/database';
import { MessageType, MessageTone } from '@/app/types/outreach';
import { BizDevAgent } from '@/app/ai_agents/agents/BizDevAgent';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Define a constant UUID for the system agent
const SYSTEM_AGENT_ID = '00000000-0000-0000-0000-000000000000';

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendUpdate = async (data: any) => {
    await writer.write(
      encoder.encode(JSON.stringify(data) + '\n')
    );
  };

  try {
    const { description, name } = await req.json();

    if (!description) {
      await sendUpdate({ error: 'Description is required' });
      await writer.close();
      return new Response(null, { status: 400 });
    }

    // Initialize BizDev agent
    await sendUpdate({ step: 'Initializing AI agent...' });
    const agent = new BizDevAgent(supabase, SYSTEM_AGENT_ID);

    // Generate sequence using AI
    await sendUpdate({ step: 'Analyzing sequence requirements...' });
    
    const prompt = `
      Create a 5-email outreach sequence based on this description: "${description}"
      
      The sequence should:
      1. Start with an initial introduction/value proposition
      2. Follow up with more detailed benefits/case studies
      3. Address common objections
      4. Provide social proof/testimonials
      5. End with a final call to action
      
      For each email, specify:
      - Message type (initial, followup, proposal, check_in, milestone, urgent)
      - Tone (formal, casual, friendly, urgent)
      - Delay in days from previous email
      - Email template with personalization variables
      
      Format the response as a JSON array of 5 messages.
    `;

    await sendUpdate({ step: 'Generating initial sequence draft...' });

    const result = await agent.execute('generate_outreach', {
      ticketId: 'sequence_generation',
      messageType: 'initial',
      context: {
        customFields: {
          prompt,
          requireJsonResponse: true
        }
      }
    });
    
    try {
      await sendUpdate({ step: 'Parsing and validating sequence...' });
      const sequence = JSON.parse(result.message);
      
      // Validate and format the sequence
      await sendUpdate({ step: 'Optimizing message timing and conditions...' });
      const formattedSequence = sequence.map((step: any, index: number) => ({
        messageType: validateMessageType(step.messageType),
        tone: validateTone(step.tone),
        delayDays: index === 0 ? 0 : Math.max(1, Math.min(14, step.delayDays || 3)),
        template: step.template,
        conditions: {
          requiresPreviousResponse: index > 0 && Math.random() > 0.5,
          minimumEngagementScore: index > 2 ? 0.3 : 0
        }
      }));

      await sendUpdate({ step: 'Sequence generation complete!', sequence: formattedSequence });
      await writer.close();
      return new Response(stream.readable, {
        headers: { 'Content-Type': 'text/event-stream' }
      });

    } catch (error) {
      console.error('Error parsing AI response:', error);
      await sendUpdate({ error: 'Failed to generate valid sequence' });
      await writer.close();
      return new Response(stream.readable, {
        headers: { 'Content-Type': 'text/event-stream' }
      });
    }

  } catch (error) {
    console.error('Error generating sequence:', error);
    await sendUpdate({ 
      error: error instanceof Error ? error.message : 'Failed to generate sequence' 
    });
    await writer.close();
    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }
}

function validateMessageType(type: string): MessageType {
  const validTypes: MessageType[] = ['initial', 'followup', 'proposal', 'check_in', 'milestone', 'urgent'];
  return validTypes.includes(type as MessageType) ? type as MessageType : 'followup';
}

function validateTone(tone: string): MessageTone {
  const validTones: MessageTone[] = ['formal', 'casual', 'friendly', 'urgent'];
  return validTones.includes(tone as MessageTone) ? tone as MessageTone : 'friendly';
} 