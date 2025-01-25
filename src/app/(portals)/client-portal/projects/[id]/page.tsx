"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { createClient } from "../../lib/supabase";
import { format } from "date-fns";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { NewTicketModal } from "../../components/ui/new-ticket-modal";
import TicketTimeline from "../../../admin-portal/components/ui/project-detail/TicketTimeline";
import { Dialog } from "@headlessui/react";
import { FiBook, FiDownload } from "react-icons/fi";
import { Checkbox } from "../../components/ui/checkbox";
import { ProjectHeader } from "../components/ProjectHeader";

type ProjectDetails = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  active_tickets: number;
  total_tickets: number;
  resolved_tickets: number;
  members: {
    user_id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  admin: {
    name: string;
    email: string;
  };
  recent_activities: {
    id: string;
    type: string;
    description: string;
    created_at: string;
    user: {
      name: string;
    };
  }[];
  tickets: {
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    assigned_to?: {
      name: string;
    };
  }[];
};

interface TicketData {
  title: string;
  description: string;
  priority: string;
  project_id: string;
  status: string;
  attachments?: string[];
}

interface TicketDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: { name: string } | null;
  zen_ticket_summaries: Array<{
    id: string;
    summary: string;
    created_at: string;
    created_by: string;
    created_by_role: string;
  }>;
  zen_ticket_activities: Array<{
    id: string;
    activity_type: string;
    content: string | null;
    media_url: string | null;
    created_at: string;
    metadata: any;
  }>;
  zen_ticket_messages: Array<{
    id: string;
    content: string;
    source: string;
    created_at: string;
    created_by: string;
    metadata: any;
  }>;
}

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<TicketDetails | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      fetchProjectDetails();
    }
  }, [user, params.id]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('zen_projects')
        .select(`
          *,
          members:zen_project_members!zen_project_members_project_id_fkey(
            user_id,
            role,
            user:zen_users!zen_project_members_user_id_fkey(
              id,
              name,
              email
            )
          ),
          admin:zen_users!zen_projects_admin_id_fkey(
            name,
            email
          ),
          tickets:zen_tickets(
            id,
            title,
            status,
            priority,
            created_at,
            updated_at,
            assigned_to:zen_users!zen_tickets_assigned_to_fkey(
              name
            )
          )
        `)
        .eq('id', params.id)
        .single();

      if (projectError) throw projectError;

      // Fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('zen_activities')
        .select(`
          id,
          type,
          description,
          created_at,
          user:zen_users!zen_activities_user_id_fkey(
            name
          )
        `)
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Calculate ticket statistics
      const tickets = projectData.tickets || [];
      const total_tickets = tickets.length;
      const resolved_tickets = tickets.filter((t: { status: string }) => t.status === 'resolved').length;
      const active_tickets = tickets.filter((t: { status: string }) => t.status !== 'resolved').length;

      setProject({
        ...projectData,
        recent_activities: activities || [],
        total_tickets,
        resolved_tickets,
        active_tickets
      });
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData: TicketData) => {
    try {
      // Separate attachments from ticket data
      const { attachments, ...ticketDataWithoutAttachments } = ticketData;

      // Create the ticket first
      const { data: ticket, error: ticketError } = await supabase
        .from('zen_tickets')
        .insert([{
          ...ticketDataWithoutAttachments,
          category: {}, // Add empty category object as it's required
          client: user.id, // Add client ID from user
          created_by: user.id, // Add creator ID from user
          priority: ticketDataWithoutAttachments.priority || 'medium' // Ensure valid priority
        }])
        .select()
        .single();

      if (ticketError) throw ticketError;

      // If there are attachments, create them in the attachments table
      if (attachments?.length) {
        const attachmentRecords = attachments.map((url: string) => ({
          ticket_id: ticket.id,
          name: url.split('/').pop() || 'attachment',
          url: url,
          type: 'image', // Default to image for now
          size: 0, // We would need to get actual file size
          uploaded_by: user.id
        }));

        const { error: attachmentError } = await supabase
          .from('zen_ticket_attachments')
          .insert(attachmentRecords);

        if (attachmentError) throw attachmentError;
      }

      // Create an activity record for the new ticket
      const { error: activityError } = await supabase
        .from('zen_activities')
        .insert([{
          project_id: project?.id,
          type: 'ticket_created',
          description: `Created ticket: ${ticket.title}`,
          user_id: user.id
        }]);

      if (activityError) throw activityError;

      // Refresh project data to show new ticket
      await fetchProjectDetails();
      setIsNewTicketModalOpen(false); // Close modal after successful creation
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      // Fetch complete ticket details including description and all related data
      const { data: selectedTicketDetails, error: ticketError } = await supabase
        .from('zen_tickets')
        .select(`
          *,
          assigned_to:zen_users!zen_tickets_assigned_to_fkey(name),
          zen_ticket_summaries(
            id,
            summary,
            created_at,
            created_by,
            created_by_role
          ),
          zen_ticket_activities(
            id,
            activity_type,
            content,
            media_url,
            created_at,
            metadata
          ),
          zen_ticket_messages(
            id,
            content,
            source,
            created_at,
            created_by,
            metadata
          )
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Set the selected ticket ID and details
      setSelectedTicketId(ticketId);
      setSelectedTicketDetails(selectedTicketDetails as TicketDetails);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ticket details');
    }
  };

  const handleTicketSelect = (ticketId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedTickets);
    if (isSelected) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedTickets(new Set(project?.tickets.map(t => t.id) || []));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleExportTickets = async () => {
    if (selectedTickets.size === 0) return;
    
    setIsExporting(true);
    try {
      const response = await fetch('/api/tickets/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTickets)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export tickets');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and click it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'ticket_export.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting tickets:', error);
      // You might want to show an error toast here
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-green-800">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <ProjectHeader
        title={project.name}
        projectId={project.id}
        onSignOut={signOut}
        userEmail={user.email || ""}
      />

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        projectId={project?.id || ""}
        onSubmit={handleCreateTicket}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Team Modal */}
        <Dialog open={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)}>
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <Dialog.Panel className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="w-full max-w-md transform overflow-hidden bg-white rounded-lg shadow-xl transition-all">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-medium text-green-800">
                      Project Team
                    </Dialog.Title>
                    <button
                      onClick={() => setIsTeamModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-gray-100">
                      <h4 className="text-sm font-medium text-green-700 mb-3">Project Admin</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-700 text-lg">{project.admin.name[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-green-800">{project.admin.name}</div>
                          <div className="text-sm text-green-600">{project.admin.email}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-3">Team Members</h4>
                      <div className="space-y-3">
                        {project.members.map((member) => (
                          <div key={member.user_id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-700 text-lg">{member.user.name[0]}</span>
                            </div>
                            <div>
                              <div className="font-medium text-green-800">{member.user.name}</div>
                              <div className="text-sm text-green-600">{member.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>

        {/* Project Overview - More Compact */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="max-w-2xl">
                <h2 className="text-lg font-medium text-green-800 mb-2">{project.name}</h2>
                <p className="text-green-600">{project.description}</p>
              </div>
              <Button
                variant="outline"
                className="text-green-600 hover:text-green-700 border-green-200"
                onClick={() => setIsTeamModalOpen(true)}
              >
                View Team ({project.members.length + 1})
              </Button>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-green-700">Resolution Rate</span>
                  <span className="text-sm text-green-600 font-medium">
                    {project.resolved_tickets} of {project.total_tickets}
                  </span>
                </div>
                <Progress 
                  value={(project.resolved_tickets / (project.total_tickets || 1)) * 100} 
                  className="bg-green-100 h-2"
                />
              </div>
              <div className="flex gap-8 border-l border-gray-100 pl-8">
                <div>
                  <div className="text-2xl font-semibold text-green-700">{project.active_tickets}</div>
                  <div className="text-xs text-green-600">Active</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-700">{project.members.length + 1}</div>
                  <div className="text-xs text-green-600">Members</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-700">
                    {format(new Date(project.created_at), "MMM d")}
                  </div>
                  <div className="text-xs text-green-600">Started</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-green-800">Tickets</h2>
              <div className="flex items-center gap-4">
                {/* Selection controls */}
                {viewMode === 'list' && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTickets.size === project.tickets.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-green-600">
                      {selectedTickets.size} selected
                    </span>
                  </div>
                )}

                {/* Export button */}
                {selectedTickets.size > 0 && (
                  <Button
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={handleExportTickets}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>Exporting...</>
                    ) : (
                      <>
                        <FiDownload className="w-4 h-4 mr-2" />
                        Export ({selectedTickets.size})
                      </>
                    )}
                  </Button>
                )}

                {/* View Toggle */}
                <div className="flex items-center bg-green-50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-green-700 shadow-sm' 
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-green-700 shadow-sm' 
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="bg-green-600 text-white hover:bg-green-500 border-green-500"
                  onClick={() => setIsNewTicketModalOpen(true)}
                >
                  New Ticket
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.tickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="relative cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <Checkbox
                        checked={selectedTickets.has(ticket.id)}
                        onCheckedChange={(checked: boolean) => handleTicketSelect(ticket.id, checked)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </div>
                    <div onClick={() => fetchTicketDetails(ticket.id)}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{ticket.title}</CardTitle>
                            <CardDescription>
                              Updated {format(new Date(ticket.updated_at), "MMM d, h:mm a")}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={ticket.status === 'resolved' ? 'default' : 'outline'}
                            className={
                              ticket.status === 'resolved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'border-green-200 text-green-700'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600">Priority: {ticket.priority}</span>
                          {ticket.assigned_to && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-700 text-xs">{ticket.assigned_to.name[0]}</span>
                              </div>
                              <span className="text-green-600">{ticket.assigned_to.name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {project.tickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="py-3 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedTickets.has(ticket.id)}
                        onCheckedChange={(checked: boolean) => handleTicketSelect(ticket.id, checked)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => fetchTicketDetails(ticket.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-medium text-green-800 truncate">{ticket.title}</h3>
                              <Badge 
                                variant={ticket.status === 'resolved' ? 'default' : 'outline'}
                                className={
                                  ticket.status === 'resolved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'border-green-200 text-green-700'
                                }
                              >
                                {ticket.status}
                              </Badge>
                              <span className="text-xs text-green-600">
                                Priority: {ticket.priority}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-green-600">
                              <span>Updated {format(new Date(ticket.updated_at), "MMM d, h:mm a")}</span>
                              {ticket.assigned_to && (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-700 text-[10px]">{ticket.assigned_to.name[0]}</span>
                                  </div>
                                  <span>{ticket.assigned_to.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button className="p-2 text-green-600 hover:text-green-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Ticket Timeline Modal */}
      {selectedTicketId && selectedTicketDetails && (
        <TicketTimeline
          isOpen={!!selectedTicketId}
          onClose={() => {
            setSelectedTicketId(null);
            setSelectedTicketDetails(null);
          }}
          ticket={{
            id: selectedTicketId,
            title: selectedTicketDetails.title,
            description: selectedTicketDetails.description,
            status: selectedTicketDetails.status,
            zen_ticket_summaries: selectedTicketDetails.zen_ticket_summaries,
            zen_ticket_activities: selectedTicketDetails.zen_ticket_activities,
            zen_ticket_messages: selectedTicketDetails.zen_ticket_messages
          }}
        />
      )}
    </div>
  );
} 