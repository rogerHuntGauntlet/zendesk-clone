import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentFactory } from '@/app/ai_agents/core/AgentFactory';
import { SupportAgent } from '@/app/ai_agents/agents/SupportAgent';
import { NLPService } from '@/app/ai_agents/services/NLPService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    // Validate all required environment variables
    const requiredEnvVars = {
      'OpenAI API Key': process.env.OPENAI_API_KEY,
      'LangSmith/LangChain API Key': process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY,
      'Pinecone API Key': process.env.NEXT_PUBLIC_PINECONE_API_KEY,
      'Tavily API Key': process.env.NEXT_PUBLIC_TAVILY_API_KEY
    };

    const missingEnvVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([name]) => name);

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required API keys: ${missingEnvVars.join(', ')}`,
          details: 'Please check your environment configuration.'
        },
        { status: 500 }
      );
    }

    // Get ticket ID from request
    const { ticketId } = await request.json();
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    console.log('Starting sentiment analysis for ticket:', ticketId);

    // Get or create support agent using AgentFactory
    const agentFactory = AgentFactory.getInstance(supabase);
    let supportAgent: SupportAgent;
    
    try {
      // Try to get existing agent first
      const { data: existingAgent } = await supabase
        .from('zen_agents')
        .select()
        .eq('role', 'support')
        .single();
        
      if (existingAgent) {
        supportAgent = await agentFactory.getExistingAgent(existingAgent.id) as SupportAgent;
      } else {
        // Create new agent if none exists
        supportAgent = await agentFactory.createAgent('support') as SupportAgent;
      }
    } catch (error) {
      console.error('Error getting/creating support agent:', error);
      return NextResponse.json(
        { error: 'Failed to initialize support agent' },
        { status: 500 }
      );
    }

    // Get ticket data
    const { data: ticket, error: ticketError } = await supabase
      .from('zen_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket fetch error:', ticketError);
      return NextResponse.json(
        { error: 'Ticket not found', details: ticketError?.message },
        { status: 404 }
      );
    }

    try {
      // Initialize NLP Service for testing
      const nlpService = new NLPService();

      // Test LangSmith tracing with sentiment analysis
      console.log('Starting sentiment analysis for ticket:', ticketId);
      const sentiment = await nlpService.analyzeSentiment(ticket.description);
      console.log('Sentiment analysis complete:', sentiment);
      
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
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      return NextResponse.json(
        { 
          error: 'AI processing failed',
          details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
        },
        { status: 500 }
      );
    }

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
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 