import React from 'react';
import { createClient } from '../../../lib/supabase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../client-portal/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../client-portal/components/ui/tabs';
import { Badge } from '../../../../client-portal/components/ui/badge';
import { ScrollArea } from '../../../../client-portal/components/ui/scroll-area';
import { format } from 'date-fns';

interface CustomerHistoryProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CustomerProfile {
  id: string;
  company: string;
  plan: string;
  total_tickets: number;
  active_tickets: number;
  user: {
    name: string;
    email: string;
  };
}

interface TicketSummary {
  summary: string;
  created_at: string;
  created_by: string;
  created_by_role: string;
}

interface TicketHistory {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  project: {
    name: string;
  };
  zen_ticket_summaries: TicketSummary[];
}

interface Interaction {
  id: string;
  type: string;
  content: string;
  created_at: string;
  ticket_id: string;
  ticket_title: string;
  media_url?: string | null;
  metadata: Record<string, any>;
}

interface SupabaseTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  project: {
    name: string;
  };
  zen_ticket_summaries: Array<{
    summary: string;
    created_at: string;
  }>;
}

export function CustomerHistoryView({ customerId, isOpen, onClose }: CustomerHistoryProps) {
  const supabase = createClient();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [tickets, setTickets] = useState<TicketHistory[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      loadCustomerData();
    }
  }, [customerId, isOpen]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabase
        .from('zen_clients')
        .select(`
          user_id,
          company,
          plan,
          total_tickets,
          active_tickets,
          user:zen_users!zen_clients_user_id_fkey(
            name,
            email
          )
        `)
        .eq('user_id', customerId)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('No profile data found');
      
      const userData = profileData.user as { name?: string; email?: string } | null;
      
      const profile: CustomerProfile = {
        id: String(profileData.user_id),
        company: String(profileData.company),
        plan: String(profileData.plan),
        total_tickets: Number(profileData.total_tickets),
        active_tickets: Number(profileData.active_tickets),
        user: {
          name: String(userData?.name || ''),
          email: String(userData?.email || '')
        }
      };
      setProfile(profile);

      // Fetch ticket history with proper typing
      const { data: ticketData, error: ticketError } = await supabase
        .from('zen_tickets')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          client,
          project:zen_projects(name),
          summaries:zen_ticket_summaries(
            id,
            summary,
            created_at,
            created_by,
            created_by_role,
            recordings
          )
        `)
        .eq('client', customerId)
        .order('created_at', { ascending: false });

      if (ticketError) throw ticketError;
      
      // Transform the data to match our TicketHistory type
      const transformedTickets: TicketHistory[] = (ticketData || []).map((ticket: any) => ({
        id: String(ticket.id),
        title: String(ticket.title),
        status: String(ticket.status),
        priority: String(ticket.priority),
        created_at: String(ticket.created_at),
        project: {
          name: String(ticket.project?.name || '')
        },
        zen_ticket_summaries: (ticket.summaries || []).map((summary: any) => ({
          summary: String(summary.summary),
          created_at: String(summary.created_at),
          created_by: String(summary.created_by),
          created_by_role: String(summary.created_by_role)
        }))
      }));
      
      setTickets(transformedTickets);

      // Fetch interactions (messages, activities)
      const { data: interactionData, error: interactionError } = await supabase
        .from('zen_ticket_activities')
        .select(`
          id,
          activity_type,
          content,
          created_at,
          media_url,
          metadata,
          ticket_id,
          ticket:zen_tickets(
            id,
            title,
            client
          )
        `)
        .eq('ticket.client', customerId)
        .order('created_at', { ascending: false });

      if (interactionError) throw interactionError;
      
      const validInteractions: Interaction[] = (interactionData || [])
        .filter(interaction => {
          if (!interaction.ticket) return false;
          const ticket = interaction.ticket as unknown as { id: string; title: string; client: string };
          return ticket && ticket.title;
        })
        .map(interaction => {
          const ticket = interaction.ticket as unknown as { id: string; title: string; client: string };
          return {
            id: String(interaction.id),
            type: String(interaction.activity_type),
            content: String(interaction.content || ''),
            created_at: String(interaction.created_at),
            ticket_id: String(interaction.ticket_id),
            ticket_title: String(ticket?.title || ''),
            media_url: interaction.media_url ? String(interaction.media_url) : undefined,
            metadata: interaction.metadata || {}
          };
        });

      setInteractions(validInteractions);

    } catch (err) {
      console.error('Error loading customer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Customer History</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive p-4">{error}</div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="interactions">Interactions</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">Company Details</h3>
                        <p className="text-muted-foreground">{profile?.company}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Contact Information</h3>
                        <p className="text-muted-foreground">{profile?.user.name}</p>
                        <p className="text-muted-foreground">{profile?.user.email}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Account Status</h3>
                        <div className="flex gap-4 mt-2">
                          <Badge>{profile?.plan} plan</Badge>
                          <Badge variant="secondary">
                            {profile?.active_tickets} active tickets
                          </Badge>
                          <Badge variant="secondary">
                            {profile?.total_tickets} total tickets
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="p-4 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{ticket.title}</h3>
                              <div className="flex gap-2">
                                <Badge variant="outline">{ticket.status}</Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    ticket.priority === 'high'
                                      ? 'border-red-500 text-red-500'
                                      : ticket.priority === 'medium'
                                      ? 'border-yellow-500 text-yellow-500'
                                      : 'border-green-500 text-green-500'
                                  }
                                >
                                  {ticket.priority}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Project: {ticket.project.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Created: {format(new Date(ticket.created_at), 'PPp')}
                            </p>
                            {ticket.zen_ticket_summaries?.[0] && (
                              <div className="mt-2 p-2 bg-accent/50 rounded-md">
                                <p className="text-sm">
                                  Latest Update: {ticket.zen_ticket_summaries[0].summary}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Interactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {interactions.map((interaction) => (
                          <div
                            key={interaction.id}
                            className="p-4 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{interaction.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(interaction.created_at), 'PPp')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Ticket: {interaction.ticket_title}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {interaction.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Response Times</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold">
                            {tickets.length > 0
                              ? Math.round(
                                  tickets.reduce(
                                    (acc, ticket) =>
                                      acc +
                                      (ticket.zen_ticket_summaries?.[0]
                                        ? new Date(
                                            ticket.zen_ticket_summaries[0].created_at
                                          ).getTime() -
                                          new Date(ticket.created_at).getTime()
                                        : 0),
                                    0
                                  ) /
                                    tickets.length /
                                    (1000 * 60 * 60)
                                )
                              : 0}h
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Average Response Time
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Ticket Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <p className="text-2xl font-semibold">
                                {(
                                  (tickets.filter(
                                    (t) => t.status === 'resolved'
                                  ).length /
                                    tickets.length) *
                                  100 || 0
                                ).toFixed(1)}
                                %
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Resolution Rate
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
} 