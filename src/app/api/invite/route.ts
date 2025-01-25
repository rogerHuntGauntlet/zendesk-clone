import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { sendProjectInviteEmail } from '@/app/utils/email';

const supabase = createClient();

export async function POST(request: Request) {
  try {
    const { email, projectId, projectName, inviteType } = await request.json();

    if (!email || !projectId || !projectName || !inviteType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique invite token
    const inviteToken = nanoid();

    // Store the invite in the database
    const { error: insertError } = await supabase
      .from('project_invites')
      .insert([
        {
          email,
          project_id: projectId,
          invite_type: inviteType,
          token: inviteToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      ]);

    if (insertError) {
      console.error('Error creating invite:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      );
    }

    // Send the invite email
    await sendProjectInviteEmail({
      email,
      projectName,
      inviteType,
      inviteToken,
    });

    return NextResponse.json({
      success: true,
      message: 'Invite sent successfully'
    });
  } catch (error) {
    console.error('Error in invite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
