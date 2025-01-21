"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Ticket, TicketStats, TimeEntry, CostEntry, TicketStatus, Client, TicketMainCategory } from "@/types";
import { TicketList } from "./components/TicketList";
import { TicketDialog } from "./components/TicketDialog";
import { KnowledgeBaseDialog } from "@/components/knowledge-base/KnowledgeBaseDialog";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LiveChat } from "./components/LiveChat";
import { CreateTicketForm } from "./components/CreateTicketForm";
import { Learning } from "./components/Learning";
import { MessageSquare, Plus, GraduationCap, AlertCircle, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { initializeMockData } from "@/lib/mock-data-init";

export default function ClientDashboard() {
  const { user, isDemo } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"tickets" | "timeline">("tickets");
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [suggestedArticleId, setSuggestedArticleId] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const { toast } = useToast();

  // Initialize mock data when component mounts
  useEffect(() => {
    initializeMockData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const clientId = user?.id || 'demo-client';
        setIsUsingDemoData(clientId === 'demo-client');
        
        const [ticketsData, statsData] = await Promise.all([
          api.getClientTickets(clientId),
          api.getTicketStats(),
        ]);
        setTickets(ticketsData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    };

    if (user) {
      loadData();
    }
  }, [user, toast]);

  useEffect(() => {
    if (editingTicket) {
      const loadTimeAndCostData = async () => {
        try {
          const [timeData, costData] = await Promise.all([
            api.getTimeEntries({ ticketId: editingTicket.id }),
            api.getCostEntries(editingTicket.id),
          ]);
          setTimeEntries(timeData);
          setCostEntries(costData);
        } catch (error) {
          console.error("Failed to load time and cost data:", error);
        }
      };

      loadTimeAndCostData();
    }
  }, [editingTicket]);

  const handleCreateTicket = async (ticketData: {
    title: string;
    description: string;
    priority: Ticket['priority'];
    category: string;
    attachments: File[];
  }) => {
    try {
      const attachmentUrls = ticketData.attachments.map(file => URL.createObjectURL(file));
      
      const newTicket = await api.createClientTicket({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        category: {
          main: ticketData.category as TicketMainCategory,
          sub: 'other'
        },
        attachments: attachmentUrls.map(url => ({
          id: `attachment-${Date.now()}`,
          url,
          name: url.split('/').pop() || 'attachment',
          type: 'file',
          size: 0,
          uploadedBy: user?.id || 'demo-client',
          uploadedAt: new Date().toISOString()
        }))
      });

      setTickets(prev => [...prev, newTicket]);
      setIsCreateTicketOpen(false);
      toast({
        title: "Ticket Created",
        description: isUsingDemoData || isDemo 
          ? "This is a demo - your ticket would be created in a real environment"
          : "Your ticket has been successfully created.",
      });
      return newTicket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLiveChatTicketCreate = async (data: {
    title: string;
    description: string;
    attachments: File[];
  }) => {
    try {
      await handleCreateTicket({
        ...data,
        priority: 'medium',
        category: 'Live Chat',
      });
    } catch (error) {
      console.error('Failed to create ticket from live chat:', error);
    }
  };

  const handleUpdateTicket = async (ticketId: string, data: Partial<Ticket>) => {
    try {
      const updatedTicket = await api.updateTicket(ticketId, data);
      setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
      setIsEditDialogOpen(false);
      setEditingTicket(null);
      toast({
        title: "Ticket Updated",
        description: "The ticket has been successfully updated.",
      });
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update the ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTimeEntry = async (ticketId: string, entry: Omit<TimeEntry, "id">) => {
    try {
      const newEntry = await api.addTimeEntry(ticketId, entry);
      setTimeEntries(prev => [...prev, newEntry]);
      toast({
        title: "Time Entry Added",
        description: "The time entry has been successfully recorded.",
      });
    } catch (error) {
      console.error("Failed to add time entry:", error);
      toast({
        title: "Error",
        description: "Failed to add time entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCostEntry = async (ticketId: string, entry: Omit<CostEntry, "id">) => {
    try {
      const newEntry = await api.addCostEntry(ticketId, entry);
      setCostEntries(prev => [...prev, newEntry]);
      toast({
        title: "Cost Entry Added",
        description: "The cost entry has been successfully recorded.",
      });
    } catch (error) {
      console.error("Failed to add cost entry:", error);
      toast({
        title: "Error",
        description: "Failed to add cost entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFeedbackSubmit = async (ticketId: string, feedback: {
    category: string;
    rating: number;
    comment: string;
    suggestions: string;
  }) => {
    try {
      await api.submitFeedback(ticketId, feedback);
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll use it to improve our service.",
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
      });
    }
  };

  const handleSurveySubmit = async (ticketId: string, survey: {
    satisfaction: number;
    resolutionEffective: boolean;
    additionalComments: string;
  }) => {
    try {
      await api.submitResolutionSurvey(ticketId, survey);
      toast({
        title: "Survey Submitted",
        description: "Thank you for completing the resolution survey!",
      });
    } catch (error) {
      console.error("Failed to submit survey:", error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
      });
    }
  };

  const handleBulkStatusUpdate = async (ticketIds: string[], newStatus: TicketStatus) => {
    try {
      await api.updateTickets(ticketIds, { status: newStatus });
      const updatedTickets = await api.getTickets();
      setTickets(updatedTickets);
      toast({
        title: "Status Updated",
        description: `Updated status for ${ticketIds.length} tickets.`,
      });
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkAssign = async (ticketIds: string[], assigneeId: string) => {
    try {
      await api.updateTickets(ticketIds, { assignedTo: assigneeId });
      const updatedTickets = await api.getTickets();
      setTickets(updatedTickets);
      toast({
        title: "Tickets Assigned",
        description: `Assigned ${ticketIds.length} tickets.`,
      });
    } catch (error) {
      console.error("Failed to assign tickets:", error);
      toast({
        title: "Error",
        description: "Failed to assign tickets. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkTag = async (ticketIds: string[], tags: string[]) => {
    try {
      await api.updateTickets(ticketIds, { tags });
      const updatedTickets = await api.getTickets();
      setTickets(updatedTickets);
      toast({
        title: "Tags Updated",
        description: `Updated tags for ${ticketIds.length} tickets.`,
      });
    } catch (error) {
      console.error("Failed to update tags:", error);
      toast({
        title: "Error",
        description: "Failed to update tags. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (
    ticketId: string,
    comment: string,
    isInternal?: boolean,
    mentions?: string[]
  ) => {
    try {
      await api.addComment({
        ticketId,
        content: comment,
        createdBy: user?.id || 'demo-client',
        isInternal: isInternal || false,
        attachments: []
      });

      // Refresh ticket data to get the new comment
      const updatedTicket = await api.getTicket(ticketId);
      if (updatedTicket) {
        setTickets(prev => prev.map(t => 
          t.id === ticketId ? updatedTicket : t
        ));
      }

      toast({
        title: "Comment Added",
        description: isUsingDemoData || isDemo 
          ? "This is a demo - your comment would be added in a real environment"
          : "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 p-4 bg-background border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Logged in as: <span className="font-medium text-foreground">{user?.name}</span></div>
            <div className="text-sm text-muted-foreground">Company: <span className="font-medium text-foreground">{(user as Client)?.company || 'Demo Company'}</span></div>
          </div>
          <Badge variant="secondary">
            DEMO View
          </Badge>
        </div>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You are viewing the demo version. Sign in to access your actual tickets and data.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tickets"
            value={stats?.totalTickets || 0}
            description="All time tickets"
          />
          <StatsCard
            title="Active Tickets"
            value={stats?.activeTickets || 0}
            description="Currently open"
          />
          <StatsCard
            title="Resolved Tickets"
            value={stats?.resolvedTickets || 0}
            description="Successfully closed"
          />
          <StatsCard
            title="Average Response"
            value={stats?.avgResponseTime || "N/A"}
            description="Time to first response"
          />
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Your Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsKnowledgeBaseOpen(true)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Knowledge Base
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLearningOpen(true)}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Learning
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiveChatOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Live Chat
              </Button>
              <Button onClick={() => setIsCreateTicketOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TicketList
              tickets={tickets}
              onEditTicket={(ticket) => {
                setEditingTicket(ticket);
                setIsEditDialogOpen(true);
              }}
              onOpenKnowledgeBase={(articleId) => {
                setSuggestedArticleId(articleId);
                setIsKnowledgeBaseOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {editingTicket && (
        <TicketDialog
          ticket={editingTicket}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdate={handleUpdateTicket}
          isUpdating={false}
          attachments={attachments}
          onAttachmentAdd={(files) => setAttachments(Array.from(files))}
          onAttachmentRemove={(index) => {
            setAttachments(prev => prev.filter((_, i) => i !== index));
          }}
          onAddComment={handleAddComment}
          mentionSuggestions={[]}
          users={[]}
        />
      )}

      <KnowledgeBaseDialog
        isOpen={isKnowledgeBaseOpen}
        onOpenChange={setIsKnowledgeBaseOpen}
        articleId={suggestedArticleId}
      />

      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent>
          <DialogTitle>Create New Ticket</DialogTitle>
          <CreateTicketForm
            onSubmit={handleCreateTicket}
            onCancel={() => setIsCreateTicketOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <LiveChat
        isOpen={isLiveChatOpen}
        onClose={() => setIsLiveChatOpen(false)}
        onCreateTicket={handleLiveChatTicketCreate}
      />

      <Dialog open={isLearningOpen} onOpenChange={setIsLearningOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogTitle>Learning Resources</DialogTitle>
          <Learning />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 