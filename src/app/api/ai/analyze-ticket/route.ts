import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
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
