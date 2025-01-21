"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { employeeManager } from "@/lib/api/employees";
import type { Ticket, TicketStats, Employee, TicketStatus } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/tickets/KanbanBoard";
import { TimelineView } from "@/components/tickets/TimelineView";
import { PersonalStats } from "@/components/stats/PersonalStats";
import { PerformanceGoals } from "@/components/stats/PerformanceGoals";
import { TicketResponseDialog } from "@/components/tickets/TicketResponseDialog";
import { toast } from "@/components/ui/use-toast";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Timer,
  List,
  LayoutDashboard,
  History,
  Brain,
  Coffee,
  Video,
  MessageSquare,
  Bell,
  X,
  Users
} from "lucide-react";
import { mockEmployee, mockTickets, mockTicketStats, mockPersonalStats, mockPerformanceGoals, mockTicketEvents } from "@/lib/mock-data";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { wsService } from "@/lib/websocket";
import { agentService } from "@/lib/agent-services";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Mock current employee ID - in a real app, this would come from auth
const CURRENT_EMPLOYEE_ID = 'emp-1';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [viewMode, setViewMode] = useLocalStorageState<'list' | 'kanban' | 'timeline'>('viewMode', 'list');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [focusModeEnabled, setFocusModeEnabled] = useLocalStorageState<boolean>('focusMode', false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [queueHealth, setQueueHealth] = useState<number>(100);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showBreakSuggestion, setShowBreakSuggestion] = useState(false);
  const [breakSuggestion, setBreakSuggestion] = useState<any>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Try to get authenticated employee data
        const authData = await api.getCurrentEmployee();
        
        if (authData) {
          setEmployee(authData);
          const employeeTickets = await api.getEmployeeTickets(authData.id);
          setTickets(employeeTickets);
          const employeeStats = await api.getEmployeeStats(authData.id);
          setStats(employeeStats);
          setIsMockData(false);
        } else {
          setEmployee(mockEmployee);
          setTickets(mockTickets.filter(ticket => ticket.assignedTo === mockEmployee.name));
          setStats(mockTicketStats);
          setIsMockData(true);
        }

        // Subscribe to workload adjustments
        const unsubscribe = employeeManager.onWorkloadAdjustmentsNeeded((adjustments) => {
          const employeeAdjustments = adjustments.filter(adj => adj.employeeId === employee?.id || CURRENT_EMPLOYEE_ID);
          employeeAdjustments.forEach(adjustment => {
            toast({
              title: "Workload Adjustment Needed",
              description: adjustment.reason,
              variant: "default",
            });
          });
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error loading data:', error);
        setEmployee(mockEmployee);
        setTickets(mockTickets.filter(ticket => ticket.assignedTo === mockEmployee.name));
        setStats(mockTicketStats);
        setIsMockData(true);
        toast({
          title: "Using Demo Data",
          description: "Unable to load real data. Showing demo data instead.",
          variant: "default",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
    localStorage.setItem('focusMode', focusModeEnabled.toString());
  }, [viewMode, focusModeEnabled, localStorage]);

  useEffect(() => {
    // Initialize WebSocket connection
    wsService.connect();

    // Subscribe to WebSocket events
    const unsubscribe = wsService.subscribe((event) => {
      switch (event.type) {
        case 'TICKET_UPDATE':
          handleTicketUpdate(event.payload);
          break;
        case 'BREAK_SUGGESTION':
          handleBreakSuggestion(event.payload);
          break;
        case 'SLA_WARNING':
          handleSLAWarning(event.payload);
          break;
        case 'QUEUE_UPDATE':
          handleQueueUpdate(event.payload);
          break;
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, []);

  const handleSearch = async () => {
    try {
      if (isMockData) {
        // Filter mock data
        const filteredTickets = mockTickets.filter(ticket => {
          const matchesSearch = searchQuery 
            ? ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
          const matchesStatus = statusFilter
            ? ticket.status === statusFilter
            : true;
          return matchesSearch && matchesStatus && ticket.assignedTo === employee?.name;
        });
        setTickets(filteredTickets);
      } else {
        // Use real API search
        const searchResults = await api.searchTickets({
          query: searchQuery,
          status: statusFilter,
          assignedTo: employee?.id
        });
        setTickets(searchResults);
      }
    } catch (error) {
      console.error('Error searching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to search tickets",
        variant: "destructive",
      });
    }
  };

  const handleAddResponse = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setIsResponding(true);
    }
  };

  const handleSubmitResponse = async (content: string, attachments: File[]) => {
    if (!selectedTicket) return;
    
    try {
      const comment = await api.addComment({
        ticketId: selectedTicket.id,
        content,
        createdBy: CURRENT_EMPLOYEE_ID,
        isInternal: false,
        attachments: []
      });
      
      const updatedTicket = await api.updateTicket(selectedTicket.id, { 
        updatedAt: new Date().toISOString() 
      });
      
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setIsResponding(false);
      toast({
        title: "Response Added",
        description: "Your response has been added to the ticket",
      });
    } catch (error) {
      console.error("Failed to add response:", error);
      toast({
        title: "Error",
        description: "Failed to add response",
        variant: "destructive",
      });
    }
  };

  const handleTicketUpdate = (payload: any) => {
    setTickets(current => 
      current.map(ticket => 
        ticket.id === payload.ticketId 
          ? { ...ticket, ...payload.updates }
          : ticket
      )
    );
  };

  const handleBreakSuggestion = (suggestion: any) => {
    setBreakSuggestion(suggestion);
    setShowBreakSuggestion(true);
    toast({
      title: "Break Suggestion",
      description: suggestion.reason,
      action: (
        <Button onClick={() => {
          agentService.recordBreak();
          setShowBreakSuggestion(false);
        }}>
          Take Break
        </Button>
      ),
    });
  };

  const handleSLAWarning = (warning: any) => {
    toast({
      title: "SLA Warning",
      description: warning.message,
      variant: "destructive",
    });
  };

  const handleQueueUpdate = (update: any) => {
    setQueueHealth(update.healthScore);
  };

  const toggleFocusMode = () => {
    const isEnabled = agentService.toggleFocusMode();
    setFocusModeEnabled(isEnabled);
    toast({
      title: isEnabled ? "Focus Mode Enabled" : "Focus Mode Disabled",
      description: isEnabled 
        ? "Notifications will be minimized to help you focus" 
        : "You'll now receive all notifications",
    });
  };

  const handleBulkAction = async (action: string) => {
    try {
      // Implement bulk actions like status update, assignment, etc.
      const updates = Array.from(selectedTickets).map(ticketId => ({
        ticketId,
        updates: { /* Add relevant updates based on action */ }
      }));
      
      // Update tickets in bulk
      await Promise.all(updates.map(update => 
        api.updateTicket(update.ticketId, update.updates)
      ));

      setSelectedTickets(new Set());
      toast({
        title: "Bulk Action Complete",
        description: `Successfully updated ${selectedTickets.size} tickets`,
      });
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee || !stats) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card className="p-6">
            <CardTitle className="mb-4">Error Loading Dashboard</CardTitle>
            <CardDescription>
              Unable to load dashboard data. Please try refreshing the page.
            </CardDescription>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const activeTickets = tickets.filter(t => t.status !== 'closed').length;
  const criticalTickets = tickets.filter(t => t.priority === 'critical').length;
  const resolvedToday = tickets.filter(t => t.status === 'resolved' && 
    new Date(t.updatedAt).toDateString() === new Date().toDateString()).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Focus Mode */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {employee.name}
              {isMockData && (
                <Badge variant="secondary" className="ml-2">
                  Demo Mode
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {employee.role} - {employee.department}
              {isMockData && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Using demo data - <a href="/login" className="underline">login</a> to see your real dashboard)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <span>Focus Mode</span>
              <Switch
                checked={focusModeEnabled}
                onCheckedChange={toggleFocusMode}
              />
            </div>
            {showBreakSuggestion && (
              <Button
                variant="outline"
                onClick={() => {
                  agentService.recordBreak();
                  setShowBreakSuggestion(false);
                }}
              >
                <Coffee className="h-4 w-4 mr-2" />
                Take a Break
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowChatPanel(!showChatPanel)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Team Chat
            </Button>
          </div>
        </div>

        {/* Quick Stats with Queue Health */}
        <div className="mb-8 grid gap-4 md:grid-cols-5">
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Active Tickets</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeTickets}</p>
              <p className="text-sm text-gray-500">Requiring attention</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Critical Issues</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{criticalTickets}</p>
              <p className="text-sm text-gray-500">High priority tickets</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Resolved Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resolvedToday}</p>
              <p className="text-sm text-gray-500">Completed tickets</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-purple-500" />
                <span>Avg. Response</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
              <p className="text-sm text-gray-500">First response time</p>
            </CardContent>
          </Card>

          {/* New Queue Health Card */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${
                  queueHealth < 70 ? 'text-red-500' : 
                  queueHealth < 90 ? 'text-yellow-500' : 
                  'text-green-500'
                }`} />
                <span>Queue Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{queueHealth}%</p>
              <p className="text-sm text-gray-500">Overall queue status</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Stats */}
        <div className="mb-8">
          <PersonalStats data={mockPersonalStats} />
        </div>

        {/* Performance Goals */}
        <div className="mb-8">
          <PerformanceGoals goals={mockPerformanceGoals} />
        </div>

        {/* Bulk Actions */}
        {selectedTickets.size > 0 && (
          <Card className="mb-4 bg-white dark:bg-gray-800 shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedTickets.size} tickets selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('status')}
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('assign')}
                >
                  Reassign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('priority')}
                >
                  Set Priority
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>Manage your assigned tickets</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  onClick={() => setViewMode('kanban')}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'outline'}
                  onClick={() => setViewMode('timeline')}
                >
                  <History className="h-4 w-4 mr-2" />
                  Timeline
                </Button>
              </div>
            </div>

            {viewMode === 'list' && (
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <select
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "")}
                >
                  <option value="">All Status</option>
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="reopened">Reopened</option>
                </select>
                <Button onClick={handleSearch}>Search</Button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <Card key={ticket.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{ticket.title}</h4>
                        <p className="mt-1 text-sm text-gray-500">{ticket.description}</p>
                        <div className="mt-2 flex gap-2">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                            ticket.status === "new" ? "bg-yellow-100 text-yellow-800" :
                            ticket.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                            ticket.status === "resolved" ? "bg-green-100 text-green-800" :
                            ticket.status === "closed" ? "bg-gray-100 text-gray-800" :
                            ticket.status === "pending" ? "bg-orange-100 text-orange-800" :
                            ticket.status === "reopened" ? "bg-red-100 text-red-800" :
                            "bg-purple-100 text-purple-800"
                          }`}>
                            {ticket.status}
                          </span>
                          <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                            ticket.priority === "critical" ? "bg-red-100 text-red-800" :
                            ticket.priority === "high" ? "bg-orange-100 text-orange-800" :
                            ticket.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Client: {ticket.client}</p>
                        <p className="text-sm text-gray-500">Last update: {ticket.updatedAt}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleAddResponse(ticket.id)}
                        >
                          Respond
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                tickets={tickets}
                onTicketUpdate={async (ticketId, newStatus) => {
                  try {
                    const updatedTicket = await api.updateTicket(ticketId, { status: newStatus as TicketStatus });
                    setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
                    toast({
                      title: "Status Updated",
                      description: `Ticket status changed to ${newStatus}`,
                    });
                  } catch (error) {
                    console.error('Failed to update ticket status:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update ticket status",
                      variant: "destructive",
                    });
                  }
                }}
              />
            ) : (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <Card key={ticket.id} className="p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {ticket.title}
                      <span className={`ml-2 inline-block rounded-full px-2 py-1 text-xs ${
                        ticket.priority === "critical" ? "bg-red-100 text-red-800" :
                        ticket.priority === "high" ? "bg-orange-100 text-orange-800" :
                        ticket.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {ticket.priority}
                      </span>
                    </h3>
                    <TimelineView
                      ticket={ticket}
                      events={mockTicketEvents.filter(event => event.ticketId === ticket.id)}
                    />
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Dialog */}
        {selectedTicket && (
          <TicketResponseDialog
            ticket={selectedTicket}
            open={isResponding}
            onCloseAction={() => setIsResponding(false)}
            onSubmitAction={handleSubmitResponse}
          />
        )}

        {/* Team Chat Panel */}
        {showChatPanel && (
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Team Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Separator className="mb-4" />
            {/* Chat implementation would go here */}
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                {/* Chat messages would go here */}
              </div>
              <div className="mt-4">
                <Input placeholder="Type a message..." />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 