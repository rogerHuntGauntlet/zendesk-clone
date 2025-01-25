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

    const { messages } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
    });

    return NextResponse.json({ 
      message: response.choices[0].message.content,
      usage: response.usage
    });
  } catch (error) {
    console.error('Error processing ticket:', error);
    return NextResponse.json({ error: 'Failed to process ticket' }, { status: 500 });
  }
}
