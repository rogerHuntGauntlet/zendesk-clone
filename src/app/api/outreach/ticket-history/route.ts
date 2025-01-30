import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { ticket } = await req.json();
    console.log('📚 Fetching ticket history for:', ticket.id);

    // Get summaries with their associated activities
    const { data: summaries, error: summaryError } = await supabase
      .from('zen_ticket_summaries')
      .select(`
        id,
        summary,
        created_at,
        created_by,
        created_by_role,
        ai_session_data
      `)
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: false })
      .limit(5); // Limit to most recent 5 sessions

    if (summaryError) {
      console.warn('Failed to fetch ticket summaries:', summaryError);
      return NextResponse.json({ 
        history: null,
        status: 'skipped',
        message: 'Ticket history unavailable'
      });
    }

    // Get activities for these summaries
    const sessionIds = summaries.map(s => s.id);
    const { data: activities, error: activitiesError } = await supabase
      .from('zen_ticket_activities')
      .select(`
        id,
        activity_type,
        content,
        created_at,
        metadata
      `)
      .eq('ticket_id', ticket.id)
      .in('metadata->session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (activitiesError) {
      console.warn('Failed to fetch ticket activities:', activitiesError);
    }

    // Get user emails for created_by values
    const createdByIds = summaries
      .map(s => s.created_by)
      .filter((id, index, self) => self.indexOf(id) === index);

    const { data: users } = await supabase
      .from('zen_users')
      .select('id, email')
      .in('id', createdByIds);

    const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

    // Process and summarize the history
    const history = {
      sessions: summaries.map(summary => ({
        id: summary.id,
        summary: summary.summary,
        created_at: summary.created_at,
        created_by: userEmailMap.get(summary.created_by) || summary.created_by,
        role: summary.created_by_role,
        activities: activities?.filter(a => 
          a.metadata?.session_id === summary.id
        ) || [],
        ai_session_data: summary.ai_session_data
      })),
      insights: {
        totalSessions: summaries.length,
        lastInteractionDate: summaries[0]?.created_at,
        commonActivities: summarizeActivities(activities || []),
        significantEvents: extractSignificantEvents(activities || [])
      }
    };

    console.log('✅ Ticket history analysis complete');
    return NextResponse.json({ 
      history,
      status: 'completed'
    });

  } catch (error) {
    console.error('❌ Error analyzing ticket history:', error);
    return NextResponse.json({ 
      history: null,
      status: 'error',
      message: 'Failed to analyze ticket history'
    });
  }
}

function summarizeActivities(activities: any[]) {
  const activityCounts = activities.reduce((acc, activity) => {
    acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(activityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type, count]) => ({
      type,
      count
    }));
}

function extractSignificantEvents(activities: any[]) {
  return activities
    .filter(activity => 
      activity.activity_type === 'milestone' ||
      activity.activity_type === 'decision' ||
      activity.activity_type === 'meeting_scheduled' ||
      (activity.content && activity.content.toLowerCase().includes('important'))
    )
    .slice(0, 3)
    .map(activity => ({
      type: activity.activity_type,
      content: activity.content,
      date: activity.created_at
    }));
} 