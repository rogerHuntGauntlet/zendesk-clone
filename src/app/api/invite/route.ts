import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { sendProjectInviteEmail } from '@/app/utils/email';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, projectId, projectName, inviteType } = await req.json();

    if (!email || !projectId || !projectName || !inviteType) {
      return NextResponse.json(
        { message: 'Missing required fields' },
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
        { message: 'Failed to create invite' },
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

    return NextResponse.json({ message: 'Invite sent successfully' });
  } catch (error) {
    console.error('Error in invite API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
