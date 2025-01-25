import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '../service/EmailService';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const emailService = new EmailService(supabase);
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await emailService.sendTestEmail(email);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
