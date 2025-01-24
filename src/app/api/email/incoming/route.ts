import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '../service/EmailService';

export async function POST(req: NextRequest) {
  try {
    const emailService = new EmailService();
    const body = await req.json();

    // Verify webhook signature if using a service like SendGrid or Postmark
    // This is just a basic example
    const { from, subject, content, threadId } = body;

    await emailService.processIncomingEmail(from, subject, content, threadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing incoming email:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}
