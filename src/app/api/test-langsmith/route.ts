import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

export async function GET() {
  try {
    // Log environment variables for debugging
    const tracing = process.env.LANGSMITH_TRACING || process.env.LANGCHAIN_TRACING_V2;
    const endpoint = process.env.LANGSMITH_ENDPOINT || process.env.LANGCHAIN_ENDPOINT;
    const project = process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT;
    const apiKey = process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY;
    const nodeEnv = process.env.NODE_ENV;

    console.log('LangSmith Configuration:', {
      tracing,
      endpoint,
      project,
      apiKeyExists: !!apiKey,
      nodeEnv
    });

    // Verify API key exists
    if (!apiKey) {
      throw new Error('Neither LANGSMITH_API_KEY nor LANGCHAIN_API_KEY is set');
    }

    // Initialize ChatOpenAI with tracing
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY
    }).withConfig({
      tags: ["test-trace"],
      runName: "Hello World Test"
    });

    // Make a test call
    const response = await model.invoke([
      new HumanMessage("Say hello world!")
    ]);

    return NextResponse.json({
      success: true,
      result: response.content,
      langsmith: {
        tracing,
        endpoint,
        project,
        apiKeyExists: !!apiKey
      }
    });

  } catch (error: any) {
    console.error('LangSmith test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      langsmith: {
        tracing: process.env.LANGSMITH_TRACING || process.env.LANGCHAIN_TRACING_V2,
        endpoint: process.env.LANGSMITH_ENDPOINT || process.env.LANGCHAIN_ENDPOINT,
        project: process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT,
        apiKeyExists: !!(process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY)
      }
    }, { status: 500 });
  }
} 