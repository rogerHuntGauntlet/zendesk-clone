"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Ticket, TicketStats, TicketStatus, TicketPriority, TicketCategory } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Save, Users, Brain } from "lucide-react";
import { TicketResponse } from "@/components/response/TicketResponse";
import { PersonalStats } from "@/components/stats/PersonalStats";
import { PerformanceGoals } from "@/components/stats/PerformanceGoals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignTicketDialog } from "@/components/tickets/AssignTicketDialog";
import { TicketResponseDialog } from "@/components/tickets/TicketResponseDialog";
import { toast } from "@/components/ui/use-toast";
import { SmartQueueFilter } from "@/components/filters/SmartQueueFilter";
import { KanbanBoard } from "@/components/tickets/KanbanBoard";
import { TimelineView } from "@/components/tickets/TimelineView";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

type SortField = 'priority' | 'date' | 'status' | 'client';
type SortDirection = 'asc' | 'desc';

const priorityOrder: Record<TicketPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

type TabValue = "queue" | "stats" | "goals" | "team-management";
type ViewMode = 'list' | 'kanban' | 'timeline';

interface TicketEvent {
  id: string;
  type: string;
  timestamp: string;
  description: string;
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewName, setViewName] = useState("");
  const [savedViews, setSavedViews] = useLocalStorageState<Array<{name: string, filters: any}>>('savedViews', []);
  const [selectedTab, setSelectedTab] = useState<TabValue>("queue");
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [isResponding, setIsResponding] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useLocalStorageState<ViewMode>('viewMode', 'list');
  const [ticketEvents, setTicketEvents] = useState<Record<string, TicketEvent[]>>({});

  // Move teams and routing rules to a separate config file or API endpoint later
  const [teams] = useState([
    {
      id: "team-1",
      name: "Technical Support",
      focusArea: "Product Technical Issues",
      members: [
        { id: "emp-1", name: "John Doe", skills: ["JavaScript", "React", "Node.js"] },
        { id: "emp-2", name: "Jane Smith", skills: ["Python", "Database", "AWS"] }
      ]
    },
    {
      id: "team-2",
      name: "Billing Support",
      focusArea: "Payment and Subscription Issues",
      members: [
        { id: "emp-3", name: "Mike Johnson", skills: ["Accounting", "Billing Systems"] },
        { id: "emp-4", name: "Sarah Wilson", skills: ["Payment Processing", "Customer Service"] }
      ]
    },
    {
      id: "team-3",
      name: "Customer Success",
      focusArea: "Account Management and Onboarding",
      members: [
        { id: "emp-5", name: "Alex Brown", skills: ["Product Training", "Account Management"] },
        { id: "emp-6", name: "Lisa Chen", skills: ["Customer Onboarding", "Project Management"] }
      ]
    }
  ]);
  
  const [routingRules] = useState([
    {
      id: "rule-1",
      condition: "Category contains 'Technical' OR Subject contains 'bug'",
      teamId: "team-1",
      priority: "High"
    },
    {
      id: "rule-2",
      condition: "Category contains 'Billing' OR Subject contains 'payment'",
      teamId: "team-2",
      priority: "Medium"
    },
    {
      id: "rule-3",
      condition: "Category contains 'Account' OR IsNewCustomer equals true",
      teamId: "team-3",
      priority: "Low"
    }
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ticketData = await api.getTickets();
        const statsData = await api.getTicketStats();
        setTickets(sortTickets(ticketData));
        setStats(statsData);

        // Load ticket events for timeline view
        const events: Record<string, TicketEvent[]> = {};
        for (const ticket of ticketData) {
          events[ticket.id] = [{
            id: '1',
            type: 'created',
            timestamp: ticket.createdAt,
            description: 'Ticket created'
          }];
        }
        setTicketEvents(events);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const sortTickets = (ticketsToSort: Ticket[]) => {
    return [...ticketsToSort].sort((a, b) => {
      switch (sortField) {
        case 'priority':
          const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
          return sortDirection === 'asc' ? diff : -diff;
        case 'date':
          return sortDirection === 'asc' 
            ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'status':
          return sortDirection === 'asc' 
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        case 'client':
          return sortDirection === 'asc'
            ? a.client.localeCompare(b.client)
            : b.client.localeCompare(a.client);
        default:
          return 0;
      }
    });
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setTickets(prev => sortTickets(prev));
  };

  const handleSearch = async () => {
    try {
      const filteredTickets = await api.getTickets({ 
        search: searchQuery,
        status: statusFilter || undefined
      });
      setTickets(sortTickets(filteredTickets));
    } catch (error) {
      console.error('Error searching tickets:', error);
    }
  };

  const handleSaveView = () => {
    if (!viewName) return;

    const newView = {
      name: viewName,
      filters: {
        search: searchQuery,
        status: statusFilter,
        sort: {
          field: sortField,
          direction: sortDirection
        }
      }
    };

    setSavedViews([...savedViews, newView]);
    setViewName("");
  };

  const handleLoadView = (view: {name: string, filters: any}) => {
    setSearchQuery(view.filters.search);
    setStatusFilter(view.filters.status);
    setSortField(view.filters.sort.field);
    setSortDirection(view.filters.sort.direction);
    handleSearch();
  };

  const handleAssignTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsAssigning(true);
  };

  const handleAssignTicket = async (ticketId: string) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      // Simplified assignment without employeeManager
      const updatedTicket = await api.updateTicket(ticketId, { 
        status: 'assigned' as TicketStatus,
        assignedTo: 'default-employee' // In a real app, this would be selected
      });
      
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      setIsAssigning(false);
      
      toast({
        title: "Ticket Assigned",
        description: "Ticket has been assigned successfully.",
      });
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      toast({
        title: "Error",
        description: "Failed to assign ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddResponse = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setIsResponding(true);
    }
  };

  const handleSubmitResponse = async (content: string, attachments: File[]) => {
    if (!selectedTicket) return;
    
    try {
      await api.addComment({
        ticketId: selectedTicket.id,
        content,
        createdBy: 'user-1', // This should come from getCurrentUser() in a real app
        isInternal: false,
        attachments: []
      });
      const updatedTicket = await api.updateTicket(selectedTicket.id, {
        status: 'in_progress' as TicketStatus
      });
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setIsResponding(false);
    } catch (error) {
      console.error("Failed to add response:", error);
    }
  };

  if (!stats) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage customer tickets and responses</p>
            </div>
            <Button variant="outline" onClick={() => alert("Logout functionality would be implemented here")}>
              Logout
            </Button>
          </div>

          <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="queue">Ticket Queue</TabsTrigger>
              <TabsTrigger value="stats">Personal Stats</TabsTrigger>
              <TabsTrigger value="goals">Performance Goals</TabsTrigger>
              <TabsTrigger value="team-management">Team Management</TabsTrigger>
            </TabsList>

            <TabsContent value="queue">
              {/* Quick Stats */}
              <div className="mb-8 grid gap-4 md:grid-cols-4">
                <Card className="bg-white dark:bg-gray-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Active Tickets</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTickets}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Critical Issues</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">High priority tickets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.criticalTickets}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Resolved Today</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Completed tickets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolvedToday}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Avg. Response</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">First response time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgResponseTime}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Ticket Management */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Ticket Queue</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">Manage and respond to customer tickets</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        onClick={() => setViewMode('list')}
                      >
                        List View
                      </Button>
                      <Button
                        variant={viewMode === 'kanban' ? 'default' : 'outline'}
                        onClick={() => setViewMode('kanban')}
                      >
                        Kanban View
                      </Button>
                      <Button
                        variant={viewMode === 'timeline' ? 'default' : 'outline'}
                        onClick={() => setViewMode('timeline')}
                      >
                        Timeline View
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Search and Filter Controls */}
                  {viewMode === 'list' && (
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search tickets..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-700"
                        />
                        <select
                          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as TicketStatus)}
                        >
                          <option value="">All Status</option>
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <Button onClick={handleSearch}>Search</Button>
                      </div>

                      {/* Smart Queue Filter */}
                      <SmartQueueFilter
                        onFilterChange={(conditions) => {
                          // Apply complex filter conditions
                          const filteredTickets = tickets.filter(ticket => {
                            return conditions.every(condition => {
                              const ticketValue = String(ticket[condition.field as keyof typeof ticket]).toLowerCase();
                              const filterValue = condition.value.toLowerCase();

                              switch (condition.operator) {
                                case 'equals':
                                  return ticketValue === filterValue;
                                case 'contains':
                                  return ticketValue.includes(filterValue);
                                case 'startsWith':
                                  return ticketValue.startsWith(filterValue);
                                case 'endsWith':
                                  return ticketValue.endsWith(filterValue);
                                case 'greaterThan':
                                  return Number(ticketValue) > Number(filterValue);
                                case 'lessThan':
                                  return Number(ticketValue) < Number(filterValue);
                                default:
                                  return true;
                              }
                            });
                          });

                          setTickets(sortTickets(filteredTickets));
                        }}
                      />

                      {/* View Management */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="View name..."
                          value={viewName}
                          onChange={(e) => setViewName(e.target.value)}
                          className="max-w-xs bg-gray-50 dark:bg-gray-700"
                        />
                        <Button onClick={handleSaveView} disabled={!viewName}>
                          <Save className="h-4 w-4 mr-2" />
                          Save View
                        </Button>
                        <select
                          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                          value=""
                          onChange={(e) => {
                            const view = savedViews.find(v => v.name === e.target.value);
                            if (view) handleLoadView(view);
                          }}
                        >
                          <option value="">Load saved view...</option>
                          {savedViews.map(view => (
                            <option key={view.name} value={view.name}>{view.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  {viewMode === 'list' ? (
                    <>
                      {/* Sorting Headers */}
                      <div className="mb-4 grid grid-cols-4 gap-4 font-semibold text-sm text-gray-600 dark:text-gray-400">
                        <button
                          className="flex items-center gap-1"
                          onClick={() => handleSort('priority')}
                        >
                          Priority
                          {sortField === 'priority' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </button>
                        <button
                          className="flex items-center gap-1"
                          onClick={() => handleSort('status')}
                        >
                          Status
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </button>
                        <button
                          className="flex items-center gap-1"
                          onClick={() => handleSort('client')}
                        >
                          Client
                          {sortField === 'client' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </button>
                        <button
                          className="flex items-center gap-1"
                          onClick={() => handleSort('date')}
                        >
                          Last Update
                          {sortField === 'date' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </button>
                      </div>

                      {/* Tickets List */}
                      <div className="space-y-4">
                        {tickets.map(ticket => (
                          <div
                            key={ticket.id}
                            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">{ticket.title}</h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{ticket.description}</p>
                                <div className="mt-2 flex gap-2">
                                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                                    ticket.status === 'new' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100" :
                                    ticket.status === 'in_progress' ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100" :
                                    ticket.status === 'resolved' ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" :
                                    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  }`}>
                                    {ticket.status}
                                  </span>
                                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                                    ticket.priority === 'critical' ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100" :
                                    ticket.priority === 'high' ? "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100" :
                                    ticket.priority === 'medium' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100" :
                                    "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                  }`}>
                                    {ticket.priority}
                                  </span>
                                  <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-900 dark:text-gray-200">
                                    {`${ticket.category.main.charAt(0).toUpperCase() + ticket.category.main.slice(1)} - ${ticket.category.sub.charAt(0).toUpperCase() + ticket.category.sub.slice(1).replace('_', ' ')}`}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Client: {ticket.client}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Assigned: {ticket.assignedTo || "Unassigned"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Last update: {ticket.updatedAt}</p>
                                <div className="mt-2 space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignTicketClick(ticket.id)}
                                  >
                                    {ticket.assignedTo ? "Reassign" : "Assign"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddResponse(ticket.id)}
                                  >
                                    Respond
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
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
                    <div className="grid grid-cols-1 gap-4">
                      {tickets.map(ticket => (
                        <Card key={ticket.id} className="p-4">
                          <h3 className="text-lg font-semibold mb-4">
                            {ticket.title}
                            <span className={`ml-2 inline-block rounded-full px-2 py-1 text-xs ${
                              ticket.priority === 'critical' ? "bg-red-100 text-red-800" :
                              ticket.priority === 'high' ? "bg-orange-100 text-orange-800" :
                              ticket.priority === 'medium' ? "bg-yellow-100 text-yellow-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {ticket.priority}
                            </span>
                          </h3>
                          <TimelineView
                            ticket={ticket}
                            events={ticketEvents[ticket.id] || []}
                          />
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <PersonalStats data={{
                ticketsResolved: stats.resolvedTickets,
                avgResponseTime: stats.avgResponseTime,
                customerSatisfaction: stats.feedbackScore * 20, // Convert 0-5 to percentage
                slaCompliance: 100 - (stats.slaBreaches / stats.totalTickets * 100),
                dailyStats: [
                  // Mock data for the chart
                  {
                    date: new Date().toLocaleDateString(),
                    resolved: stats.resolvedToday,
                    responses: Math.round(stats.resolvedToday * 1.5),
                    satisfaction: stats.feedbackScore * 20
                  }
                ]
              }} />
            </TabsContent>

            <TabsContent value="goals">
              <PerformanceGoals goals={[
                {
                  id: "1",
                  metric: "Tickets Resolved",
                  target: 50,
                  progress: stats.resolvedTickets,
                  unit: "",
                  trend: { value: 5, direction: 'up' },
                  timeframe: 'weekly',
                  startDate: new Date().toISOString()
                }
              ]} />
            </TabsContent>

            <TabsContent value="team-management">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Administrative Control Section */}
                <Card className="bg-white dark:bg-gray-800 shadow-lg col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Management
                      </CardTitle>
                      <CardDescription>Create and manage support teams</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => alert("Add Team")}>
                      Add Team
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teams.map(team => (
                        <Card key={team.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{team.name}</h3>
                              <p className="text-sm text-gray-500">Focus: {team.focusArea}</p>
                            </div>
                            <div className="space-x-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">Manage Members</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Routing Intelligence Section */}
                <Card className="bg-white dark:bg-gray-800 shadow-lg col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Routing Intelligence
                      </CardTitle>
                      <CardDescription>Configure ticket routing rules and load balancing</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => alert("Add Rule")}>
                      Add Rule
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {routingRules.map(rule => (
                        <Card key={rule.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">Rule Condition</h3>
                              <p className="text-sm text-gray-500">{rule.condition}</p>
                            </div>
                            <div className="space-x-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">Delete</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Add the AssignTicketDialog */}
          <AssignTicketDialog
            open={isAssigning}
            onOpenChange={setIsAssigning}
            onAssign={() => selectedTicketId && handleAssignTicket(selectedTicketId)}
            currentAssignee={selectedTicketId ? tickets.find(t => t.id === selectedTicketId)?.assignedTo : undefined}
          />

          {/* Add the TicketResponseDialog */}
          {selectedTicket && (
            <TicketResponseDialog
              ticket={selectedTicket}
              open={isResponding}
              onCloseAction={() => setIsResponding(false)}
              onSubmitAction={handleSubmitResponse}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 