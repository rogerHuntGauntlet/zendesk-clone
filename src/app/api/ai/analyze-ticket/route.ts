import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { content } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping to analyze support ticket content.'
        },
        {
          role: 'user',
          content: `Please analyze this support ticket content and provide insights: ${content}`
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    console.error('Error analyzing ticket:', error);
    return NextResponse.json({ error: 'Failed to analyze ticket' }, { status: 500 });
  }
}
