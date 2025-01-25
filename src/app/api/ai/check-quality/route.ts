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
          content: 'You are an AI assistant helping to check the quality of support ticket content.'
        },
        {
          role: 'user',
          content: `Please check the quality of this ticket content and provide feedback: ${content}`
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ quality: response.choices[0].message.content });
  } catch (error) {
    console.error('Error checking quality:', error);
    return NextResponse.json({ error: 'Failed to check quality' }, { status: 500 });
  }
}
