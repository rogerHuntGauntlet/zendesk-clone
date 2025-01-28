import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { NLPService } from '@/app/ai_agents/services/NLPService';
import { SupportAgent } from '@/app/ai_agents/agents/SupportAgent';

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    if (!process.env.LANGSMITH_API_KEY && !process.env.LANGCHAIN_API_KEY) {
      throw new Error('LangSmith/LangChain API key is not configured');
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // Get ticket data
    const { data: ticket, error: ticketError } = await supabase
      .from('zen_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket fetch error:', ticketError);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Initialize NLP Service for testing
    const nlpService = new NLPService();

    // Test LangSmith tracing with sentiment analysis
    console.log('Starting sentiment analysis for ticket:', ticketId);
    const sentiment = await nlpService.analyzeSentiment(ticket.description);
    console.log('Sentiment analysis complete:', sentiment);
    
    // Initialize Support Agent
    const supportAgent = new SupportAgent(supabase, 'test_agent');
    
    // Run analysis on ticket
    console.log('Starting ticket analysis');
    const analysis = await supportAgent.execute('analyze', {
      content: ticket.description,
      ticketId: ticket.id
    });
    console.log('Ticket analysis complete');

    // Generate AI response
    console.log('Generating AI response');
    const response = await supportAgent.execute('respond', {
      ticketId: ticket.id,
      previousMessages: [],
      userQuery: ticket.description
    });
    console.log('AI response generated');

    // Log success in production
    if (process.env.NODE_ENV === 'production') {
      console.log('AI update completed successfully for ticket:', ticketId, {
        sentiment,
        analysisReceived: !!analysis,
        responseReceived: !!response
      });
    }

    return NextResponse.json({
      success: true,
      sentiment,
      analysis,
      response
    });

  } catch (error) {
    // Enhanced error logging for production
    console.error('Error in AI update:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 