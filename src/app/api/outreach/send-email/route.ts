import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client, Run } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";

const OUTREACH_PROJECT_NAME = process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH || "outreach-crm-ai";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize LangSmith components
const client = new Client({
  apiUrl: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
  apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH,
});

const tracer = new LangChainTracer({
  projectName: OUTREACH_PROJECT_NAME,
});

export async function POST(request: Request) {
  let run: Run | undefined;

  try {
    const { ticketId, prospectEmail, message, subject, metadata } = await request.json();

    if (!ticketId || !prospectEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Start LangSmith run
    const runParams = {
      name: "Send Email",
      run_type: "chain",
      project_name: OUTREACH_PROJECT_NAME,
      inputs: { ticketId, prospectEmail, subject, metadata },
      start_time: Date.now()
    };
    run = await client.createRun(runParams) as unknown as Run;

    // Simulate email sending
    const simulatedEmailResult = {
      messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      response: '250 Message accepted',
      accepted: [prospectEmail],
      rejected: [],
      pending: [],
      envelope: {
        from: 'simulated@example.com',
        to: [prospectEmail]
      }
    };

    // Create a new session record
    const { error: sessionError } = await supabase
      .from('zen_ticket_sessions')
      .insert({
        ticket_id: ticketId,
        type: 'outreach_email',
        status: 'completed',
        metadata: {
          email_message_id: simulatedEmailResult.messageId,
          email_response: simulatedEmailResult,
          outreach_metadata: metadata,
          is_simulated: true
        },
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      // Update LangSmith run with error
      if (run) {
        await client.updateRun(run.id, {
          end_time: Date.now(),
          error: 'Failed to create session record',
          outputs: { error: sessionError }
        });
      }
      throw new Error('Failed to create session record');
    }

    // Add a message to the ticket
    const { error: messageError } = await supabase
      .from('zen_ticket_messages')
      .insert({
        ticket_id: ticketId,
        content: message,
        source: 'outreach_email',
        metadata: {
          email_message_id: simulatedEmailResult.messageId,
          email_status: 'simulated_sent',
          is_simulated: true,
          ...metadata,
        },
      });

    if (messageError) {
      console.error('Error creating message:', messageError);
      // Update LangSmith run with error
      if (run) {
        await client.updateRun(run.id, {
          end_time: Date.now(),
          error: 'Failed to create message record',
          outputs: { error: messageError }
        });
      }
      throw new Error('Failed to create message record');
    }

    // Add an activity record
    const { error: activityError } = await supabase
      .from('zen_ticket_activities')
      .insert({
        ticket_id: ticketId,
        activity_type: 'email_sent',
        content: `[SIMULATED] Outreach email sent to ${prospectEmail}`,
        metadata: {
          email_message_id: simulatedEmailResult.messageId,
          email_subject: subject,
          is_simulated: true,
          ...metadata,
        },
      });

    if (activityError) {
      console.error('Error creating activity:', activityError);
      // Update LangSmith run with error
      if (run) {
        await client.updateRun(run.id, {
          end_time: Date.now(),
          error: 'Failed to create activity record',
          outputs: { error: activityError }
        });
      }
      throw new Error('Failed to create activity record');
    }

    console.log('[SIMULATED] Email sent:', {
      to: prospectEmail,
      subject: subject,
      messageId: simulatedEmailResult.messageId
    });

    // Update LangSmith run with success
    if (run) {
      await client.updateRun(run.id, {
        end_time: Date.now(),
        outputs: {
          messageId: simulatedEmailResult.messageId,
          emailResult: simulatedEmailResult
        }
      });
    }

    return NextResponse.json({
      success: true,
      messageId: simulatedEmailResult.messageId,
      simulated: true
    });

  } catch (error) {
    console.error('Error in send-email:', error);
    // Update LangSmith run with error
    if (run) {
      await client.updateRun(run.id, {
        end_time: Date.now(),
        error: error instanceof Error ? error.message : 'Failed to send email',
        outputs: { error: 'Failed to send email' }
      });
    }
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 