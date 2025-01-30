'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { ChevronDownIcon, ChevronUpIcon, Squares2X2Icon as ViewGridIcon, ListBulletIcon as ViewListIcon, TableCellsIcon as ViewBoardsIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '@/app/components/StrictModeDroppable';
import { FiPlusCircle, FiClock, FiPause, FiCheckCircle, FiArchive, FiCircle, FiTrendingUp, FiTarget, FiBook } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import TicketTimeline from '@/app/(portals)/admin-portal/components/ui/project-detail/TicketTimeline';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CustomerHistoryButton } from '../../components/ui/project-detail/CustomerHistoryButton';
import { Badge } from '@/app/(portals)/admin-portal/components/ui/badge';
import { useUser } from '@supabase/auth-helpers-react';
import SharedNotes from '@/app/(portals)/admin-portal/components/ui/project-detail/SharedNotes';
import { NewTicketModal } from '@/app/(portals)/client-portal/components/ui/new-ticket-modal';

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  admin_id: string;
  employee_count: number;
  client_count: number;
  active_tickets: number;
}

interface ProjectMember {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  created_at: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const TICKET_STATUSES = ['new', 'in_progress', 'resolved'] as const;

type TicketStatus = typeof TICKET_STATUSES[number];

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  assigned_to: string | null;
  client: string;
  assignee?: {
    name: string;
    email: string;
  };
}

interface ProjectClient {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

// Add TicketView type
type TicketView = 'list' | 'grid' | 'kanban';

interface GroupedTickets {
  [key: string]: Ticket[];
}

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case 'new':
      return 'bg-blue-500/10';
    case 'in_progress':
      return 'bg-yellow-500/10';
    case 'resolved':
      return 'bg-green-500/10';
    default:
      return 'bg-white/10';
  }
};

const getStatusIcon = (status: TicketStatus) => {
  switch (status) {
    case 'new':
      return <FiPlusCircle className="w-4 h-4" />;
    case 'in_progress':
      return <FiClock className="w-4 h-4" />;
    case 'resolved':
      return <FiCheckCircle className="w-4 h-4" />;
    default:
      return <FiCircle className="w-4 h-4" />;
  }
};

const getStatusDisplay = (status: TicketStatus) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
type Priority = typeof PRIORITIES[number];

interface TicketFilters {
  search: string;
  priorities: Priority[];
  statuses: TicketStatus[];
  assignee: string | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

const supabase = createClientComponentClient();
const user = useUser();

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500/10 text-red-300';
    case 'high':
      return 'bg-orange-500/10 text-orange-300';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-300';
    case 'low':
      return 'bg-blue-500/10 text-blue-300';
    default:
      return 'bg-white/10 text-white/60';
  }
};

const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case 'urgent':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔵';
    default:
      return '⚪';
  }
};

const SORT_OPTIONS = {
  'priority-desc': 'Priority (High to Low)',
  'priority-asc': 'Priority (Low to High)',
  'created-desc': 'Newest First',
  'created-asc': 'Oldest First',
  'updated-desc': 'Recently Updated',
  'updated-asc': 'Least Recently Updated'
} as const;

type SortOption = keyof typeof SORT_OPTIONS;

const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
};

// Add TabType
type TabType = 'tickets' | 'team-notes' | 'analytics';

// Add type for Supabase responses
interface SupabaseProjectMember {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  created_at: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface SupabaseTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  assigned_to: string | null;
  client: string;
  assignee?: {
    name: string;
    email: string;
  };
}

interface SupabaseProjectClient {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

const ProjectDetailPage = () => {
  const params = useParams() as { id: string };
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<ProjectClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isManagementSectionExpanded, setIsManagementSectionExpanded] = useState(true);
  const [ticketView, setTicketView] = useState<TicketView>('list');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [groupedTickets, setGroupedTickets] = useState<GroupedTickets>({
    new: [],
    in_progress: [],
    resolved: []
  });
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  } | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    search: '',
    priorities: [],
    statuses: [],
    assignee: null,
    dateRange: {
      start: null,
      end: null
    }
  });
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('priority-desc');
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [showTeamNotes, setShowTeamNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('tickets');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  const groupTickets = (tickets: Ticket[]): GroupedTickets => {
    const grouped: GroupedTickets = {
      new: [],
      in_progress: [],
      resolved: []
    };

    // Sort tickets before grouping if using priority sort
    const sortedTickets = sortOption.startsWith('priority') 
      ? sortTickets(tickets)
      : tickets;

    sortedTickets.forEach(ticket => {
      if (grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    });

    // Sort non-priority sorts within each group
    if (!sortOption.startsWith('priority')) {
      Object.keys(grouped).forEach(status => {
        grouped[status as TicketStatus] = sortTickets(grouped[status as TicketStatus]);
      });
    }

    return grouped;
  };

  useEffect(() => {
    const grouped = groupTickets(tickets);
    setGroupedTickets(grouped);
  }, [tickets]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      fetchProjectData();
    }
  }, [params.id, user]);

  // Add filter effect
  useEffect(() => {
    let filtered = [...tickets];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(ticket => filters.priorities.includes(ticket.priority as Priority));
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(ticket => filters.statuses.includes(ticket.status));
    }

    // Apply assignee filter
    if (filters.assignee) {
      filtered = filtered.filter(ticket => ticket.assigned_to === filters.assignee);
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(ticket => 
        new Date(ticket.created_at) >= new Date(filters.dateRange.start!)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(ticket => 
        new Date(ticket.created_at) <= new Date(filters.dateRange.end!)
      );
    }

    // Apply sorting
    filtered = sortTickets(filtered);

    setFilteredTickets(filtered);
    
    // Update grouped tickets for kanban view
    const grouped = groupTickets(filtered);
    setGroupedTickets(grouped);
  }, [tickets, filters, sortOption]);

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('zen_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));

      toast.success('Ticket status updated');
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    if (!currentUser) return;

    try {
      // First, ensure the user exists in zen_users
      const { data: existingUser, error: userCheckError } = await supabase
        .from('zen_users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (userCheckError || !existingUser) {
        // Create the user if they don't exist
        const { error: createUserError } = await supabase
          .from('zen_users')
          .insert({
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata?.name || currentUser.email,
            role: 'employee'
          });

        if (createUserError) throw createUserError;
      }

      // Now assign the ticket
      const { error: updateError } = await supabase
        .from('zen_tickets')
        .update({ assigned_to: currentUser.id })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Update local state
      setTickets(tickets.map(ticket =>
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              assigned_to: currentUser.id,
              assignee: { 
                name: currentUser.user_metadata?.name || currentUser.email || 'Unknown',
                email: currentUser.email || ''
              }
            } 
          : ticket
      ));

      toast.success('Ticket claimed successfully');
    } catch (error) {
      console.error('Error claiming ticket:', error);
      toast.error('Failed to claim ticket');
    }
  };

  // Function to render ticket card (shared between views)
  const renderTicketCard = (ticket: Ticket, className: string = '') => (
    <div
      key={ticket.id}
      className={`p-4 bg-white/5 rounded-lg space-y-2 ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-white font-medium">{ticket.title}</h3>
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              getStatusColor(ticket.status)
            )}>
              {getStatusDisplay(ticket.status)}
            </span>
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
              getPriorityColor(ticket.priority as Priority)
            )}>
              {getPriorityIcon(ticket.priority as Priority)}
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </span>
          </div>
        </div>
        {ticket.client && (
          <CustomerHistoryButton customerId={ticket.client} />
        )}
      </div>
      <p className="text-white/60 text-sm">{ticket.description}</p>
      <div className="flex justify-between items-center pt-2">
        <div className="text-sm text-white/60">
          {ticket.assignee ? (
            <span>Assigned to: {ticket.assignee.name}</span>
          ) : (
            <span>Unassigned</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!ticket.assigned_to ? (
            <button
              onClick={() => handleClaimTicket(ticket.id)}
              className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 px-3 py-1 rounded-md text-sm"
            >
              Claim Ticket
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedTicket(ticket);
                setIsTimelineModalOpen(true);
              }}
              className="bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 px-3 py-1 rounded-md text-sm"
            >
              Work on it
            </button>
          )}
          {ticket.status !== 'resolved' && (
            <button
              onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
              className="bg-green-600/20 text-green-300 hover:bg-green-600/30 px-3 py-1 rounded-md text-sm"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const fetchProjectData = async () => {
    if (!currentUser) return;
    
    try {
      // First get the project details
      const { data: projectData, error: projectError } = await supabase
        .from('zen_projects')
        .select('*')
        .eq('id', params.id as string)
        .single();

      if (projectError) throw projectError;

      // Get employee count
      const { count: employeeCount } = await supabase
        .from('zen_project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', params?.id as string)
        .eq('role', 'employee');

      // Get client count
      const { count: clientCount } = await supabase
        .from('zen_project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', params?.id as string  )
        .eq('role', 'client');

      // Get active tickets count (only for assigned/unassigned tickets)
      const { count: activeTickets } = await supabase
        .from('zen_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', params?.id as string)
        .neq('status', 'resolved')
        .or(`assigned_to.is.null,assigned_to.eq.${currentUser.id}`);

      // Combine the data
      const projectWithCounts = {
        ...projectData,
        employee_count: employeeCount || 0,
        client_count: clientCount || 0,
        active_tickets: activeTickets || 0
      } as Project;

      setProject(projectWithCounts);

      // Fetch project members with proper typing
      const { data: membersData, error: membersError } = await supabase
        .from('zen_project_members')
        .select(`
          *,
          user:zen_users!zen_project_members_user_id_fkey(
            name,
            email,
            role
          )
        `)
        .eq('project_id', params?.id as string);

      if (membersError) throw membersError;

      // Fetch project tickets with proper typing
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('zen_tickets')
        .select(`
          *,
          assignee:zen_users!zen_tickets_assigned_to_fkey(
            name,
            email
          )
        `)
        .eq('project_id', params?.id as string)
        .or(`assigned_to.is.null,assigned_to.eq.${currentUser.id}`);

      if (ticketsError) throw ticketsError;

      // Fetch project clients with proper typing
      const { data: clientsData, error: clientsError } = await supabase
        .from('zen_project_members')
        .select(`
          *,
          user:zen_users!zen_project_members_user_id_fkey(
            name,
            email
          )
        `)
        .eq('project_id', params?.id as string)
        .eq('role', 'client');

      if (clientsError) throw clientsError;

      // Format the clients data
      const formattedClients = (clientsData || []).map(client => ({
        ...client,
        name: client.user?.name || '',
        email: client.user?.email || ''
      }));

      setMembers(membersData as unknown as ProjectMember[]);
      setTickets(ticketsData as unknown as Ticket[]);
      setClients(formattedClients);

    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as TicketStatus;
    const destinationStatus = result.destination.droppableId as TicketStatus;
    
    if (sourceStatus === destinationStatus) return;

    const ticketId = result.draggableId;
    await handleUpdateTicketStatus(ticketId, destinationStatus);
  };

  const handleSessionComplete = () => {
    fetchProjectData(); // Refresh the data after session completion
  };

  // Update subscription handler
  useEffect(() => {
    if (!project?.id || !currentUser?.id) return;

    const channel = supabase
      .channel(`project-${project.id}-tickets`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zen_tickets',
          filter: `project_id=eq.${project.id} AND (assigned_to.is.null OR assigned_to.eq.${currentUser.id})`
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          
          try {
            switch (payload.eventType) {
              case 'INSERT': {
                const { data: newTicket, error } = await supabase
                  .from('zen_tickets')
                  .select(`
                    *,
                    assignee:zen_users(
                      name,
                      email
                    )
                  `)
                  .eq('id', payload.new.id)
                  .single();

                if (error) throw error;
                if (newTicket) {
                  setTickets(prev => [...prev, newTicket as unknown as Ticket]);
                  toast.success('New ticket created');
                }
                break;
              }
              case 'UPDATE': {
                const { data: updatedTicket, error } = await supabase
                  .from('zen_tickets')
                  .select(`
                    *,
                    assignee:zen_users(
                      name,
                      email
                    )
                  `)
                  .eq('id', payload.new.id)
                  .single();

                if (error) throw error;
                if (updatedTicket) {
                  setTickets(prev => 
                    prev.map(ticket => 
                      ticket.id === updatedTicket.id ? (updatedTicket as unknown as Ticket) : ticket
                    )
                  );
                  toast.success('Ticket updated');
                }
                break;
              }
              case 'DELETE':
                setTickets(prev => 
                  prev.filter(ticket => ticket.id !== payload.old.id)
                );
                toast.success('Ticket deleted');
                break;
            }
          } catch (error) {
            console.error('Error handling real-time update:', error);
            toast.error('Failed to process ticket update');
          }
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [project?.id, currentUser?.id]);

  // Update sorting logic
  const sortTickets = (tickets: Ticket[]) => {
    return [...tickets].sort((a, b) => {
      switch (sortOption) {
        case 'priority-desc':
          return PRIORITY_ORDER[a.priority as Priority] - PRIORITY_ORDER[b.priority as Priority];
        case 'priority-asc':
          return PRIORITY_ORDER[b.priority as Priority] - PRIORITY_ORDER[a.priority as Priority];
        case 'created-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'updated-desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'updated-asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        default:
          return 0;
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-amber-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-amber-800 p-4">
        <div className="max-w-7xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold">Project not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-amber-800 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/employee-portal/projects')}
            className="text-violet-400 hover:text-violet-300 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to projects
          </button>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <button
              onClick={() => router.push('/knowledge-base')}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              <FiBook className="w-5 h-5" />
              Learning Center
            </button>
          </div>
          <p className="text-white/60">{project.description}</p>
        </div>

        {/* Tab Menu */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                Tickets
              </button>
              <button
                onClick={() => setActiveTab('team-notes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'team-notes'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                Team Notes
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Tickets</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      Filters
                      {(filters.search || filters.priorities.length > 0 || filters.statuses.length > 0 || filters.assignee || filters.dateRange.start || filters.dateRange.end) && (
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      )}
                    </button>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white [&>option]:text-gray-900"
                    >
                      {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                        <option key={value} value={value}>
                          Sort by: {label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTicketView('list')}
                        className={`p-2 rounded-lg ${ticketView === 'list' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                      >
                        <ViewListIcon className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => setTicketView('grid')}
                        className={`p-2 rounded-lg ${ticketView === 'grid' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                      >
                        <ViewGridIcon className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => setTicketView('kanban')}
                        className={`p-2 rounded-lg ${ticketView === 'kanban' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                      >
                        <ViewBoardsIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="bg-white/5 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Search */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/60">Search</label>
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          placeholder="Search tickets..."
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                        />
                      </div>

                      {/* Priority Filter */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/60">Priority</label>
                        <div className="flex flex-wrap gap-2">
                          {PRIORITIES.map(priority => (
                            <button
                              key={priority}
                              onClick={() => setFilters(prev => ({
                                ...prev,
                                priorities: prev.priorities.includes(priority)
                                  ? prev.priorities.filter(p => p !== priority)
                                  : [...prev.priorities, priority]
                              }))}
                              className={`px-3 py-1 rounded-full text-sm ${
                                filters.priorities.includes(priority)
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/60">Status</label>
                        <div className="flex flex-wrap gap-2">
                          {TICKET_STATUSES.map(status => (
                            <button
                              key={status}
                              onClick={() => setFilters(prev => ({
                                ...prev,
                                statuses: prev.statuses.includes(status)
                                  ? prev.statuses.filter(s => s !== status)
                                  : [...prev.statuses, status]
                              }))}
                              className={`px-3 py-1 rounded-full text-sm ${
                                filters.statuses.includes(status)
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                            >
                              {getStatusDisplay(status)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assignee Filter */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/60">Assignee</label>
                        <select
                          value={filters.assignee || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            assignee: e.target.value || null
                          }))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        >
                          <option value="">All Assignees</option>
                          {members
                            .filter(member => member.role === 'employee')
                            .map(member => (
                              <option key={member.user_id} value={member.user_id}>
                                {member.user.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Date Range */}
                      <div className="space-y-2 col-span-full md:col-span-2">
                        <label className="text-sm text-white/60">Date Range</label>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="date"
                            value={filters.dateRange.start || ''}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, start: e.target.value }
                            }))}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                          />
                          <input
                            type="date"
                            value={filters.dateRange.end || ''}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, end: e.target.value }
                            }))}
                            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      {/* Clear Filters */}
                      <div className="col-span-full flex justify-end">
                        <button
                          onClick={() => setFilters({
                            search: '',
                            priorities: [],
                            statuses: [],
                            assignee: null,
                            dateRange: { start: null, end: null }
                          })}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {ticketView === 'kanban' ? (
                  <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
                    <div className="grid grid-cols-3 gap-4">
                      {TICKET_STATUSES.map((status) => (
                        <div key={status} className="space-y-4">
                          <div className="flex items-center gap-2 text-white mb-4">
                            {getStatusIcon(status)}
                            <span className="font-medium">{getStatusDisplay(status)}</span>
                            <span className="text-white/60">({groupedTickets[status].length})</span>
                          </div>
                          <StrictModeDroppable droppableId={status}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "min-h-[200px] rounded-lg p-4",
                                  getStatusColor(status),
                                  isDragging && "ring-2 ring-violet-500/50"
                                )}
                              >
                                {groupedTickets[status].map((ticket, index) => (
                                  <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="mb-4 last:mb-0"
                                      >
                                        {renderTicketCard(ticket)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </StrictModeDroppable>
                        </div>
                      ))}
                    </div>
                  </DragDropContext>
                ) : (
                  <div className={ticketView === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
                    {filteredTickets.map((ticket) => renderTicketCard(ticket))}
                  </div>
                )}
              </div>
            )}

            {/* Team Notes Tab */}
            {activeTab === 'team-notes' && project && (
              <div className="h-[700px]">
                <SharedNotes
                  projectId={project.id}
                  currentUser={{
                    id: user?.id || '',
                    email: user?.email || '',
                    role: user?.user_metadata?.role || ''
                  }}
                />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Personal Performance Section */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <FiTrendingUp className="w-6 h-6" />
                    Personal Performance
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Response Time Card */}
                    <div className="bg-white/5 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white">Average Response Time</h3>
                        <FiClock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-white">2.5h</div>
                        <div className="text-sm text-white/60">Team average: 3.2h</div>
                        <div className="text-sm text-green-400">24% faster than team average</div>
                      </div>
                    </div>

                    {/* Resolution Rate Card */}
                    <div className="bg-white/5 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white">Resolution Rate</h3>
                        <FiCheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-white">92%</div>
                        <div className="text-sm text-white/60">Team average: 85%</div>
                        <div className="text-sm text-green-400">7% above team average</div>
                      </div>
                    </div>

                    {/* SLA Compliance Card */}
                    <div className="bg-white/5 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white">SLA Compliance</h3>
                        <FiTarget className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-white">98%</div>
                        <div className="text-sm text-white/60">Team average: 95%</div>
                        <div className="text-sm text-green-400">3% above team average</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time-based Metrics */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Performance Over Time</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Daily</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Tickets Resolved</span>
                          <span className="text-white">12</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Avg Response Time</span>
                          <span className="text-white">1.8h</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Weekly</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Tickets Resolved</span>
                          <span className="text-white">47</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Avg Response Time</span>
                          <span className="text-white">2.2h</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Monthly</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Tickets Resolved</span>
                          <span className="text-white">189</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Avg Response Time</span>
                          <span className="text-white">2.5h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Goals Section */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Performance Goals</h2>
                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="space-y-6">
                      {/* Response Time Goal */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white">Response Time Goal (2h)</span>
                          <span className="text-white">80%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>

                      {/* Resolution Rate Goal */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white">Resolution Rate Goal (90%)</span>
                          <span className="text-white">92%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>

                      {/* SLA Compliance Goal */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white">SLA Compliance Goal (95%)</span>
                          <span className="text-white">98%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add TicketTimeline */}
      {selectedTicket && (
        <TicketTimeline
          isOpen={isTimelineModalOpen}
          onClose={() => {
            setIsTimelineModalOpen(false);
            setSelectedTicket(null);
            fetchProjectData(); // Refresh data after closing
          }}
          ticket={selectedTicket}
        />
      )}

      {/* Fixed New Ticket Button */}
      <button
        onClick={() => setIsNewTicketModalOpen(true)}
        className="fixed bottom-8 left-8 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-full text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
      >
        <FiPlusCircle className="w-5 h-5" />
        New Ticket
      </button>

      {/* New Ticket Modal */}
      {project && (
        <NewTicketModal
          isOpen={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          projectId={params.id}
          projectName={project?.name || ''}
          userRole="employee"
          userId={user?.id || ''}
          onSubmit={async (ticketData) => {
            try {
              const { data, error } = await supabase
                .from('zen_tickets')
                .insert([{
                  ...ticketData,
                  project_id: project.id,
                  status: 'new'
                }]);
                
              if (error) throw error;
              
              setIsNewTicketModalOpen(false);
              fetchProjectData(); // Refresh the tickets list
            } catch (err) {
              console.error('Error creating ticket:', err);
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage; 