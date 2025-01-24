import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '../service/EmailService';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // This endpoint should be protected and only callable by a scheduled job
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const emailService = new EmailService();

    // Get all active projects
    const { data: projects } = await supabase
      .from('zen_projects')
      .select('id')
      .eq('status', 'active');

    if (!projects) {
      return NextResponse.json({ message: 'No active projects found' });
    }

    // Send digest for each project
    const results = await Promise.allSettled(
      projects.map(project => emailService.sendDailyDigest(project.id))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Processed ${projects.length} projects`,
      stats: {
        succeeded,
        failed
      }
    });
  } catch (error) {
    console.error('Error sending daily digests:', error);
    return NextResponse.json(
      { error: 'Failed to send daily digests' },
      { status: 500 }
    );
  }
}
