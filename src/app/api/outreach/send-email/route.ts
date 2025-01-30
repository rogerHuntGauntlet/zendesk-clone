import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { ticketId, prospectEmail, message, subject, metadata } = await request.json();

    if (!ticketId || !prospectEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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
      throw new Error('Failed to create activity record');
    }

    console.log('[SIMULATED] Email sent:', {
      to: prospectEmail,
      subject: subject,
      messageId: simulatedEmailResult.messageId
    });

    return NextResponse.json({
      success: true,
      messageId: simulatedEmailResult.messageId,
      simulated: true
    });

  } catch (error) {
    console.error('Error in send-email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 