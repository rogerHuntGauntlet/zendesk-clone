'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import AddMemberModal from '../../components/ui/project-detail/AddMemberModal';
import AssignTicketModal from '../../components/ui/project-detail/AssignTicketModal';
import InviteClientModal from '../../components/ui/project-detail/InviteClientModal';
import TicketTimeline from '../../components/ui/project-detail/TicketTimeline';
import SharedNotes from '../../components/ui/project-detail/SharedNotes';
import ProjectAnalytics from '../../components/ui/project-detail/ProjectAnalytics';
import ScheduleManagement from '../../components/ui/project-detail/ScheduleManagement';
import { ChevronDownIcon, ChevronUpIcon, Squares2X2Icon as ViewGridIcon, ListBulletIcon as ViewListIcon, TableCellsIcon as ViewBoardsIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '@/app/components/StrictModeDroppable';
import { FiPlusCircle, FiClock, FiPause, FiCheckCircle, FiArchive, FiCircle, FiBook } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { useAuth } from '../../hooks/useAuth';

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
    company: string;
  };
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const auth = useAuth();
  const [user, setUser] = useState<any>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<ProjectClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAssignTicketModalOpen, setIsAssignTicketModalOpen] = useState(false);
  const [isInviteClientModalOpen, setIsInviteClientModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isManagementSectionExpanded, setIsManagementSectionExpanded] = useState(true);
  const [ticketView, setTicketView] = useState<TicketView>('list');
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('tickets');
  const [groupedTickets, setGroupedTickets] = useState<GroupedTickets>({
    new: [],
    in_progress: [],
    resolved: []
  });

  const groupTickets = (tickets: Ticket[]): GroupedTickets => {
    const grouped: GroupedTickets = {
      new: [],
      in_progress: [],
      resolved: []
    };

    tickets.forEach(ticket => {
      if (grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    });

    return grouped;
  };

  useEffect(() => {
    const grouped = groupTickets(tickets);
    setGroupedTickets(grouped);
  }, [tickets]);

  // Function to render ticket card (shared between views)
  const renderTicketCard = (ticket: Ticket, className: string = '') => (
    <div
      key={ticket.id}
      className={`p-4 bg-white/5 rounded-lg space-y-2 ${className}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-white font-medium">{ticket.title}</h3>
        <div className="flex items-center gap-2">
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
            className="bg-white/5 text-xs rounded-md px-2 py-1 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {TICKET_STATUSES.map(status => (
              <option key={status} value={status}>
                {getStatusDisplay(status)}
              </option>
            ))}
          </select>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            getStatusColor(ticket.status)
          )}>
            {getStatusDisplay(ticket.status)}
          </span>
        </div>
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
          <button
            onClick={() => {
              setSelectedTicket(ticket);
              setIsAssignTicketModalOpen(true);
            }}
            className="text-violet-400 hover:text-violet-300 text-sm"
          >
            Assign
          </button>
          <button
            onClick={() => {
              setSelectedTicket(ticket);
              setIsTimelineModalOpen(true);
            }}
            className="bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 px-3 py-1 rounded-md text-sm"
          >
            Work on it
          </button>
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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/admin-portal/login');
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    fetchProjectData();
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('zen_projects')
        .select('*')
        .eq('id', params.id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch project members with user details
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
        .eq('project_id', params.id)
        .neq('role', 'client');

      if (membersError) throw membersError;
      setMembers(membersData);

      // Fetch project clients with user and client details
      const { data: clientsData, error: clientsError } = await supabase
        .from('zen_project_members')
        .select(`
          *,
          user:zen_users!zen_project_members_user_id_fkey(
            id,
            name,
            email,
            client:zen_clients!zen_clients_user_id_fkey(
              company
            )
          )
        `)
        .eq('project_id', params.id)
        .eq('role', 'client');

      if (clientsError) throw clientsError;
      
      // Transform the data to match our interface
      const transformedClients = clientsData.map(client => ({
        ...client,
        user: {
          ...client.user,
          company: client.user?.client?.[0]?.company || 'N/A'
        }
      }));
      setClients(transformedClients);

      // Fetch project tickets with assignee details
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('zen_tickets')
        .select(`
          *,
          assignee:zen_users!zen_tickets_assigned_to_fkey(
            name,
            email
          )
        `)
        .eq('project_id', params.id);

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData);

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('zen_pending_invites')
        .select('*')
        .eq('project_id', params.id)
        .eq('status', 'pending');

      if (invitesError) throw invitesError;
      setPendingInvites(invitesData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
      setLoading(false);
    }
  };

  const handleAddMember = async (email: string, role: string) => {
    try {
      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from('zen_users')
        .select('id, email')
        .eq('email', email);

      if (!userData || userData.length === 0) {
        // User doesn't exist, create invite
        const { data: invite, error: inviteError } = await supabase
          .from('zen_pending_invites')
          .insert({
            email,
            project_id: params.id,
            role,
            status: 'pending'
          })
          .select()
          .single();

        if (inviteError) throw inviteError;

        // Send invite email
        try {
          await fetch('/api/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              projectName: project?.name || '',
              inviteType: role,
              inviteToken: invite.id
            }),
          });
          toast.success(`Invitation sent to ${email}`);
        } catch (emailError) {
          console.error('Error sending invite email:', emailError);
          toast.error('Invite created but email failed to send');
        }
      } else {
        // Check if user is already a member
        const { data: existingMember, error: memberCheckError } = await supabase
          .from('zen_project_members')
          .select('*')
          .eq('user_id', userData[0].id)
          .eq('project_id', params.id)
          .single();

        if (existingMember) {
          toast.error('This user is already a member of the project');
          return;
        }

        // User exists and is not a member, add them to project
        const { error: memberError } = await supabase
          .from('zen_project_members')
          .insert({
            user_id: userData[0].id,
            project_id: params.id,
            role
          });

        if (memberError) throw memberError;
        toast.success('Member added successfully');
      }

      setIsAddMemberModalOpen(false);
      // Refresh data after successful invite
      await fetchProjectData();
      
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleAssignTicket = async (ticketId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('zen_tickets')
        .update({ assigned_to: userId })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket assigned successfully');
      fetchProjectData();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const handleInviteClient = async (email: string, company: string) => {
    try {
      console.log('Starting client invitation process for:', email);
      console.log('Checking if user exists...');
      
      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from('zen_users')
        .select('id, email')
        .eq('email', email);
      
      console.log('User lookup response:', { 
        userData,
        userError,
        exists: userData && userData.length > 0 
      });

      if (!userData || userData.length === 0) {
        console.log('User not found, checking for pending invites...');
        
        // Check if invite is pending
        const { data: existingInvite, error: inviteCheckError } = await supabase
          .from('zen_pending_invites')
          .select('*')
          .eq('email', email)
          .eq('project_id', params.id);
          
        console.log('Pending invite check:', { 
          existingInvite,
          inviteCheckError,
          hasPendingInvite: existingInvite && existingInvite.length > 0 
        });

        if (existingInvite && existingInvite.length > 0) {
          console.log('Found existing invite');
          toast.error('An invitation is already pending for this email');
          return;
        }

        console.log('Creating new invite...');
        // Create new invite
        const { error: inviteError } = await supabase
          .from('zen_pending_invites')
          .insert({
            email,
            project_id: params.id,
            role: 'client',
            status: 'pending'
          });

        if (inviteError) {
          console.error('Failed to create invite:', inviteError);
          throw inviteError;
        }
        
        console.log('Invite created successfully');
        toast.success(`Invitation sent to ${email}`);
      } else {
        console.log('User exists, checking if already a member...');
        // User exists, check if already a member
        const { data: existingMember, error: memberCheckError } = await supabase
          .from('zen_project_members')
          .select('*')
          .eq('user_id', userData[0].id)
          .eq('project_id', params.id);
          
        console.log('Member check:', { 
          existingMember,
          memberCheckError,
          isMember: existingMember && existingMember.length > 0 
        });

        if (existingMember && existingMember.length > 0) {
          console.log('User is already a member');
          toast.error('This user is already a member of the project');
          return;
        }

        console.log('Adding user as client...');
        // Add them as client
        const { error: clientError } = await supabase
          .from('zen_project_members')
          .insert({
            user_id: userData[0].id,
            project_id: params.id,
            role: 'client'
          });

        if (clientError) {
          console.error('Failed to add client member:', clientError);
          throw clientError;
        }

        console.log('Updating client info...');
        // Update or create client info
        const { error: clientInfoError } = await supabase
          .from('zen_clients')
          .upsert({
            user_id: userData[0].id,
            company,
            plan: 'standard'
          });

        if (clientInfoError) {
          console.error('Failed to update client info:', clientInfoError);
          throw clientInfoError;
        }

        console.log('Client added successfully');
        toast.success('Client added successfully');
      }

      setIsInviteClientModalOpen(false);
      // Refresh data after successful invite
      await fetchProjectData();

    } catch (error) {
      console.error('Detailed error in inviting client:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
      toast.error('Failed to invite client');
    }
  };

  // Update the handleUpdateTicketStatus function to be optimistic
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('zen_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      // Revert the optimistic update
      await fetchProjectData();
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    if (!result.destination) return;

    const ticketId = result.draggableId;
    const newStatus = result.destination.droppableId as TicketStatus;

    // Optimistically update UI
    setTickets(currentTickets => {
      return currentTickets.map(ticket => {
        if (ticket.id === ticketId) {
          const updatedTicket: Ticket = {
            ...ticket,
            status: newStatus
          };
          return updatedTicket;
        }
        return ticket;
      });
    });

    try {
      await handleUpdateTicketStatus(ticketId, newStatus);
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      // Revert the optimistic update
      await fetchProjectData();
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    handleUpdateTicketStatus(ticketId, newStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-white/10 rounded-lg"></div>
              <div className="h-64 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Project not found</h1>
          <button
            onClick={() => router.push('/admin-portal/projects')}
            className="text-violet-400 hover:text-violet-300"
          >
            ← Back to projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin-portal/projects')}
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

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'tickets'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Tickets
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'analytics'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'notes'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Shared Notes
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'schedule'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Schedule
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Team Management Section */}
            <div>
              <div 
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => setIsManagementSectionExpanded(!isManagementSectionExpanded)}
              >
                <h2 className="text-2xl font-bold text-white">Project Management</h2>
                <div className="flex items-center gap-2 text-white/80 hover:text-white">
                  <span className="text-sm">
                    {isManagementSectionExpanded ? 'Hide' : 'Show'} Management
                  </span>
                  {isManagementSectionExpanded ? (
                    <ChevronUpIcon className="w-6 h-6" />
                  ) : (
                    <ChevronDownIcon className="w-6 h-6" />
                  )}
                </div>
              </div>

              {isManagementSectionExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Team Members Management */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-white">Team Members</h2>
                      <button
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
                      >
                        <FiPlusCircle className="w-5 h-5" />
                        Add Member
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">{member.user.name}</p>
                            <p className="text-white/60 text-sm">{member.user.email}</p>
                            <p className="text-white/40 text-sm capitalize">{member.role}</p>
                          </div>
                          <button className="text-red-400 hover:text-red-300 text-sm">
                            Remove
                          </button>
                        </div>
                      ))}
                      {members.length === 0 && pendingInvites.filter(invite => invite.role !== 'client').length === 0 && (
                        <p className="text-white/60 text-center py-4">No team members yet</p>
                      )}
                      {pendingInvites.filter(invite => invite.role !== 'client').map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">{invite.email}</p>
                            <p className="text-white/60 text-sm">Pending Invitation</p>
                          </div>
                          <span className="text-yellow-400 text-sm">Pending</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clients Management */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-white">Clients</h2>
                      <button
                        onClick={() => setIsInviteClientModalOpen(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
                      >
                        <FiPlusCircle className="w-5 h-5" />
                        Invite Client
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">{client.user.name}</p>
                            <p className="text-white/60 text-sm">{client.user.email}</p>
                            <p className="text-white/40 text-sm">{client.user.company}</p>
                          </div>
                          <button className="text-red-400 hover:text-red-300 text-sm">
                            Remove
                          </button>
                        </div>
                      ))}
                      {clients.length === 0 && pendingInvites.filter(invite => invite.role === 'client').length === 0 && (
                        <p className="text-white/60 text-center py-4">No clients yet</p>
                      )}
                      {pendingInvites.filter(invite => invite.role === 'client').map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">{invite.email}</p>
                            <p className="text-white/60 text-sm">Pending Invitation</p>
                          </div>
                          <span className="text-yellow-400 text-sm">Pending</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tickets Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Tickets</h2>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setTicketView('list')}
                    className={`p-2 rounded ${ticketView === 'list' ? 'bg-white/10 text-violet-400' : 'text-white/60 hover:text-white'}`}
                    title="List View"
                  >
                    <ViewListIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setTicketView('grid')}
                    className={`p-2 rounded ${ticketView === 'grid' ? 'bg-white/10 text-violet-400' : 'text-white/60 hover:text-white'}`}
                    title="Grid View"
                  >
                    <ViewGridIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setTicketView('kanban')}
                    className={`p-2 rounded ${ticketView === 'kanban' ? 'bg-white/10 text-violet-400' : 'text-white/60 hover:text-white'}`}
                    title="Kanban View"
                  >
                    <ViewBoardsIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Ticket Views */}
              {ticketView === 'kanban' ? (
                <DragDropContext
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TICKET_STATUSES.map((status) => (
                      <StrictModeDroppable key={status} droppableId={status}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              'p-4 rounded-lg min-h-[200px]',
                              getStatusColor(status as TicketStatus)
                            )}
                          >
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                              {getStatusIcon(status as TicketStatus)}
                              {getStatusDisplay(status as TicketStatus)}
                              <span className="ml-auto text-sm text-white/60">
                                {groupedTickets[status]?.length || 0}
                              </span>
                            </h3>
                            <div className="space-y-3">
                              {groupedTickets[status]?.map((ticket, index) => (
                                <Draggable
                                  key={ticket.id}
                                  draggableId={ticket.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      {renderTicketCard(ticket)}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </StrictModeDroppable>
                    ))}
                  </div>
                </DragDropContext>
              ) : (
                <div className={ticketView === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
                  {tickets.map((ticket) => renderTicketCard(ticket))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <ProjectAnalytics projectId={project.id} />
          </div>
        )}

        {activeTab === 'notes' && (
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

        {activeTab === 'schedule' && (
          <ScheduleManagement 
            projectId={project.id}
            members={members}
          />
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSubmit={handleAddMember}
      />

      <InviteClientModal
        isOpen={isInviteClientModalOpen}
        onClose={() => setIsInviteClientModalOpen(false)}
        onSubmit={handleInviteClient}
      />

      {selectedTicket && (
        <>
          <AssignTicketModal
            isOpen={isAssignTicketModalOpen}
            onClose={() => setIsAssignTicketModalOpen(false)}
            ticket={selectedTicket}
            members={members}
            onSubmit={handleAssignTicket}
          />
          
          <TicketTimeline
            isOpen={isTimelineModalOpen}
            onClose={() => {
              setIsTimelineModalOpen(false);
              setSelectedTicket(null);
            }}
            ticket={selectedTicket}
          />
        </>
      )}
    </div>
  );
} 