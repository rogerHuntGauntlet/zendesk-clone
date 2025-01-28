import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { FiPlus, FiMessageSquare, FiSearch, FiFilter, FiChevronDown, FiChevronRight, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';
import Link from 'next/link';
import TicketTimeline from './TicketTimeline';

interface TeamActivity {
  id: string;
  activity_type: string;
  content: string;
  created_at: string;
  created_by: string;
  ticket_id: string;
  ticket_title: string;
  user_name: string;
  user_email: string;
  user_role: string;
}

interface JoinedActivity {
  id: string;
  activity_type: string;
  content: string;
  created_at: string;
  created_by: string;
  ticket_id: string;
  zen_tickets: {
    id: string;
    title: string;
  };
  zen_users: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface TeamActivityFeedProps {
  projectId: string;
}

export default function TeamActivityFeed({ projectId }: TeamActivityFeedProps) {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<{ id: string; title: string; } | null>(null);
  const [showTicketTimeline, setShowTicketTimeline] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchActivities();
    fetchTeamMembers();
    subscribeToActivities();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    type UserResponse = {
      zen_users: {
        id: string;
        name: string;
      }[];
    };

    const { data, error } = await supabase
      .from('zen_ticket_activities')
      .select('zen_users:created_by(id, name)')
      .eq('zen_tickets.project_id', projectId)
      .not('zen_users', 'is', null);

    if (!error && data) {
      const uniqueMembers = new Map<string, { id: string; name: string }>();
      (data as unknown as UserResponse[]).forEach((item) => {
        if (item.zen_users && item.zen_users.length > 0) {
          const user = item.zen_users[0];
          uniqueMembers.set(user.id, {
            id: user.id,
            name: user.name
          });
        }
      });
      setTeamMembers(Array.from(uniqueMembers.values()));
    }
  };

  const fetchActivities = async () => {
    try {
      const { data: tickets } = await supabase
        .from('zen_tickets')
        .select('id')
        .eq('project_id', projectId);

      if (!tickets?.length) {
        setActivities([]);
        return;
      }

      const ticketIds = tickets.map(t => t.id);

      const { data, error } = await supabase
        .from('zen_ticket_activities')
        .select(`
          id,
          activity_type,
          content,
          created_at,
          created_by,
          ticket_id,
          zen_tickets:ticket_id (
            id,
            title
          ),
          zen_users:created_by (
            id,
            name,
            email,
            role
          )
        `)
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedActivities = (data as unknown as JoinedActivity[]).map(activity => ({
        id: activity.id,
        activity_type: activity.activity_type,
        content: activity.content,
        created_at: activity.created_at,
        created_by: activity.created_by,
        ticket_id: activity.ticket_id,
        ticket_title: activity.zen_tickets.title,
        user_name: activity.zen_users.name,
        user_email: activity.zen_users.email,
        user_role: activity.zen_users.role
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityExpansion = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchQuery === '' || 
      activity.ticket_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUser = selectedUser === '' || activity.created_by === selectedUser;

    return matchesSearch && matchesUser;
  });

  const subscribeToActivities = () => {
    const subscription = supabase
      .channel('team_activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'zen_ticket_activities',
          filter: `ticket_id=in.(select id from zen_tickets where project_id='${projectId}')`
        },
        (payload) => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
        return <FiPlus className="w-5 h-5 text-green-400" />;
      case 'session_added':
        return <FiMessageSquare className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Team Activity</h2>
        <div className="flex gap-4">
          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* User Filter */}
          <div className="relative">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Team Members</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <p className="text-white/60 text-center py-8">No team activities found</p>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white/5 rounded-lg overflow-hidden"
            >
              {/* Activity Header */}
              <div 
                className="flex items-start gap-4 p-4 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => toggleActivityExpansion(activity.id)}
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{activity.user_name}</span>
                    <span className="text-white/60">•</span>
                    <span className="text-sm text-white/60">{activity.user_role}</span>
                  </div>
                  <p className="text-white/80 mt-1">
                    {activity.activity_type === 'ticket_created' ? (
                      <>Created ticket: <span className="text-violet-400">{activity.ticket_title}</span></>
                    ) : activity.activity_type === 'session_added' ? (
                      <>Added a session to <span className="text-violet-400">{activity.ticket_title}</span></>
                    ) : (
                      activity.content
                    )}
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {expandedActivities.has(activity.id) ? (
                    <FiChevronDown className="w-5 h-5 text-white/40" />
                  ) : (
                    <FiChevronRight className="w-5 h-5 text-white/40" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedActivities.has(activity.id) && (
                <div className="border-t border-white/10 p-4 bg-white/5">
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60">Activity Type:</span>
                      <span className="ml-2 text-white">{activity.activity_type}</span>
                    </div>
                    {activity.content && (
                      <div>
                        <span className="text-white/60">Content:</span>
                        <p className="mt-1 text-white">{activity.content}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-white/60">Related Ticket:</span>
                      <button 
                        onClick={() => {
                          setSelectedTicket({
                            id: activity.ticket_id,
                            title: activity.ticket_title
                          });
                          setShowTicketTimeline(true);
                        }}
                        className="ml-2 text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                      >
                        {activity.ticket_title}
                        <FiExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <span className="text-white/60">Team Member:</span>
                      <span className="ml-2 text-white">{activity.user_name} ({activity.user_email})</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Ticket Timeline Modal */}
      {selectedTicket && (
        <TicketTimeline
          isOpen={showTicketTimeline}
          onClose={() => {
            setShowTicketTimeline(false);
            setSelectedTicket(null);
          }}
          ticket={{
            id: selectedTicket.id,
            title: selectedTicket.title,
            description: '', // These will be fetched by the TicketTimeline component
            status: '',
          }}
        />
      )}
    </div>
  );
} 