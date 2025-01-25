import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '../service/EmailService';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const emailService = new EmailService(supabase);
    
    const body = await req.json();
    const { from, subject, text, html } = body;

    if (!from || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await emailService.processIncomingEmail({
      from,
      subject,
      text,
      html
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing incoming email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
