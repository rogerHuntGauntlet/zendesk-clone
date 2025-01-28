import { NextResponse } from 'next/server';
import { NLPService } from '@/app/ai_agents/services/NLPService';

export async function GET() {
  const startTime = Date.now();
  const requestId = `request-${startTime}`;
  
  try {
    // Log all relevant environment variables
    const config = {
      // LangSmith config
      langsmith: {
        tracing: process.env.LANGSMITH_TRACING,
        endpoint: process.env.LANGSMITH_ENDPOINT,
        project: process.env.LANGSMITH_PROJECT,
        apiKeyExists: !!process.env.LANGSMITH_API_KEY,
      },
      // LangChain config
      langchain: {
        tracingV2: process.env.LANGCHAIN_TRACING_V2,
        endpoint: process.env.LANGCHAIN_ENDPOINT,
        project: process.env.LANGCHAIN_PROJECT,
        apiKeyExists: !!process.env.LANGCHAIN_API_KEY,
      },
      nodeEnv: process.env.NODE_ENV,
    };
    
    console.log(`[${requestId}] Starting LangSmith test with config:`, config);

    if (!process.env.LANGSMITH_API_KEY && !process.env.LANGCHAIN_API_KEY) {
      throw new Error('Neither LANGSMITH_API_KEY nor LANGCHAIN_API_KEY is set');
    }

    const nlpService = new NLPService();
    console.log(`[${requestId}] NLP Service initialized`);
    
    const result = await nlpService.testLangSmithTracing();
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Test completed successfully in ${duration}ms:`, result);
    
    return NextResponse.json({ 
      success: true, 
      result,
      config,
      metadata: {
        requestId,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Error in LangSmith test after ${duration}ms:`, error);
    return NextResponse.json({ 
      success: false, 
      error: {
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      config: {
        langsmith: {
          tracing: process.env.LANGSMITH_TRACING,
          endpoint: process.env.LANGSMITH_ENDPOINT,
          project: process.env.LANGSMITH_PROJECT,
          apiKeyExists: !!process.env.LANGSMITH_API_KEY,
        },
        langchain: {
          tracingV2: process.env.LANGCHAIN_TRACING_V2,
          endpoint: process.env.LANGCHAIN_ENDPOINT,
          project: process.env.LANGCHAIN_PROJECT,
          apiKeyExists: !!process.env.LANGCHAIN_API_KEY,
        },
        nodeEnv: process.env.NODE_ENV
      },
      metadata: {
        requestId,
        duration,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 