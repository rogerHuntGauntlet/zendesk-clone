import { sendProjectInviteEmail } from '@/app/utils/email';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, projectName, inviteType, inviteToken } = body;

    // Validate required fields
    if (!email || !projectName || !inviteType || !inviteToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the email
    await sendProjectInviteEmail({
      email,
      projectName,
      inviteType,
      inviteToken,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-invite API:', error);
    return NextResponse.json(
      { error: 'Failed to send invite email' },
      { status: 500 }
    );
  }
}
