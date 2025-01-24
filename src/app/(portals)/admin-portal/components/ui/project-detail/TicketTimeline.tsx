'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import WorkOnTicketModal from './WorkOnTicketModal';
import { toast } from 'react-hot-toast';

interface TicketTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    zen_ticket_summaries?: Array<{
      id: string;
      summary: string;
      created_at: string;
      created_by: string;
      created_by_role: string;
    }>;
    zen_ticket_activities?: Array<{
      id: string;
      activity_type: string;
      content: string | null;
      media_url: string | null;
      created_at: string;
      metadata: any;
    }>;
    zen_ticket_messages?: Array<{
      id: string;
      content: string;
      source: string;
      created_at: string;
      created_by: string;
      media_url: string | null;
      metadata: any;
    }>;
  };
  userRole?: 'admin' | 'employee' | 'client';
}

interface Session {
  id: string;
  summary: string;
  created_at: string;
  created_by: string;
  user_email?: string;
  user_role?: 'admin' | 'employee' | 'client';
  activities: Activity[];
  expanded: boolean;
}

interface Activity {
  id: string;
  activity_type: string;
  content?: string;
  media_url?: string;
  created_at: string;
  metadata: any;
}

interface TicketSummaryWithUser {
  id: string;
  summary: string;
  created_at: string;
  created_by: string;
  created_by_role: string;
  user_email: string;
}

interface TicketSummaryResponse {
  id: string;
  summary: string;
  created_at: string;
  created_by: string;
  created_by_role: string;
  zen_users: {
    email: string;
  } | null;
}

export default function TicketTimeline({ isOpen, onClose, ticket, userRole = 'client' }: TicketTimelineProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const SESSIONS_PER_PAGE = 5;
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen) {
      setPage(0); 
      loadSessions(0);
    }
  }, [isOpen]);

  const loadSessions = async (pageNum: number) => {
    try {
      setIsLoading(true);
      if (pageNum === 0) {
        toast.loading('Loading ticket history...');
      }

      const { data: summaries, error: summaryError } = await supabase
        .from('zen_ticket_summaries')
        .select(`
          id,
          summary,
          created_at,
          created_by,
          created_by_role
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false })
        .range(pageNum * SESSIONS_PER_PAGE, (pageNum + 1) * SESSIONS_PER_PAGE - 1);

      if (summaryError) throw summaryError;

      const createdByIds = (summaries || [])
        .map(s => s.created_by)
        .filter((id, index, self) => self.indexOf(id) === index);

      const { data: users } = await supabase
        .from('zen_users')
        .select('id, email')
        .in('id', createdByIds);

      const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

      const { count } = await supabase
        .from('zen_ticket_summaries')
        .select('*', { count: 'exact', head: true })
        .eq('ticket_id', ticket.id);

      setHasMore((count || 0) > (pageNum + 1) * SESSIONS_PER_PAGE);

      const sessionsData = (summaries || []).map(summary => ({
        id: summary.id,
        summary: summary.summary,
        created_at: summary.created_at,
        created_by: summary.created_by,
        user_email: userEmailMap.get(summary.created_by) || summary.created_by,
        user_role: summary.created_by_role as Session['user_role'],
        activities: [], 
        expanded: false
      }));

      if (pageNum === 0) {
        setSessions(sessionsData);
        toast.success('Ticket history loaded');
      } else {
        setSessions(prev => [...prev, ...sessionsData]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionActivities = async (sessionId: string) => {
    try {
      setLoadingSessionId(sessionId);
      const { data: activities, error: activityError } = await supabase
        .from('zen_ticket_activities')
        .select(`
          id,
          activity_type,
          content,
          media_url,
          created_at,
          metadata,
          ticket_id
        `)
        .eq('ticket_id', ticket.id)
        .contains('metadata', { session_id: sessionId })
        .order('created_at', { ascending: true });

      if (activityError) throw activityError;

      setSessions(prev => prev.map(session => 
        session.id === sessionId
          ? { ...session, activities: activities || [] }
          : session
      ));

      return activities || [];
    } catch (error) {
      console.error('Error loading session activities:', error);
      toast.error('Failed to load session activities');
      return [];
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleViewSession = async (session: Session) => {
    setSelectedSession({
      ...session,
      activities: [] 
    });
    setShowWorkModal(true);
    setIsReadOnly(true);

    const activities = await loadSessionActivities(session.id);
    
    setSelectedSession(prev => prev ? { 
      ...prev, 
      activities: activities 
    } : null);
  };

  const toggleExpand = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, expanded: !session.expanded }
        : session
    ));
  };

  const getFirstLine = (text: string) => {
    return text.split('\n')[0];
  };

  const handleWorkSuccess = () => {
    setShowWorkModal(false);
    setSelectedSession(null);
    setLoadingSessionId(null);
    setPage(0);
    loadSessions(0);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          
          <Dialog.Panel className="relative bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex-none p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-white">
                    Ticket History
                  </Dialog.Title>
                  <p className="text-white/60 mt-1">View all sessions and updates for this ticket</p>
                </div>
                <button
                  onClick={() => {
                    setShowWorkModal(true);
                    setIsReadOnly(false);
                    setSessions([]); 
                  }}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Create New Session
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {isLoading && page === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/100 rounded-full animate-spin mb-4" />
                  <p className="text-white/60">Loading ticket history...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No sessions found for this ticket.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gray-800/50 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-white/60 text-sm">
                              {format(new Date(session.created_at), 'MMM d, h:mm a')}
                            </span>
                            <span className="text-white/80 text-sm flex items-center gap-1">
                              <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-white/80">
                                {session.user_email || 'Unknown User'}
                              </span>
                              {session.user_role && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  session.user_role === 'admin' ? 'bg-red-500/20 text-red-300' :
                                  session.user_role === 'employee' ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-green-500/20 text-green-300'
                                }`}>
                                  {session.user_role}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(session.id)}
                              className="text-white/60 hover:text-white text-sm"
                            >
                              {session.expanded ? 'Show Less' : 'Show More'}
                            </button>
                            <button
                              onClick={() => handleViewSession(session)}
                              className="text-violet-400 hover:text-violet-300 text-sm"
                            >
                              View Session Details
                            </button>
                          </div>
                        </div>
                        <div className="text-white/80">
                          {session.expanded ? (
                            <pre className="whitespace-pre-wrap text-sm font-sans">
                              {session.summary}
                            </pre>
                          ) : (
                            <p className="text-sm truncate">
                              {getFirstLine(session.summary)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => {
                          const nextPage = page + 1;
                          setPage(nextPage);
                          loadSessions(nextPage);
                        }}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoading && (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white/100 rounded-full animate-spin" />
                        )}
                        Load More Sessions
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-none p-6 border-t border-white/10">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {showWorkModal && selectedSession && (
        <WorkOnTicketModal
          isOpen={showWorkModal}
          onClose={() => setShowWorkModal(false)}
          ticketId={ticket.id}
          sessionId={selectedSession.id}
          onSuccess={handleWorkSuccess}
          userRole={userRole} 
        />
      )}
    </>
  );
}