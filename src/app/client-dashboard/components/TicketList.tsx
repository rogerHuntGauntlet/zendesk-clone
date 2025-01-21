import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, AlertTriangle, CheckCircle2, Clock, MessageSquare, Search, Filter, X, LayoutGrid, LayoutList, BookOpen, MessageCircle, Tag, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Ticket, TicketStatus, TicketMainCategory, TicketPriority, TicketCategory, TicketSubCategory } from "@/types";
import { TimelinePreview } from "./TimelinePreview";
import { useState, useMemo, useEffect } from "react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { PostResolutionSurvey } from "@/components/feedback/PostResolutionSurvey";
import { useToast } from "@/hooks/use-toast";

interface TicketListProps {
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
  onOpenKnowledgeBase?: (articleId: string) => void;
  onSubmitFeedback?: (ticketId: string, feedback: {
    category: string;
    rating: number;
    comment: string;
    suggestions: string;
  }) => void;
  onSubmitSurvey?: (ticketId: string, survey: {
    satisfaction: number;
    resolutionEffective: boolean;
    additionalComments: string;
  }) => void;
  onBulkStatusUpdate?: (ticketIds: string[], newStatus: TicketStatus) => void;
  onBulkAssign?: (ticketIds: string[], assigneeId: string) => void;
  onBulkTag?: (ticketIds: string[], tags: string[]) => void;
}

type ActionGroup = 'all' | 'needs_response' | 'waiting' | 'in_progress' | 'resolved';
type FilterState = {
  search: string;
  mainCategory: string;
  subCategory: string;
  priority: string;
  status: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  tags: string[];
  hasAttachments: boolean | null;
};
type ViewMode = 'list' | 'grid';

export function TicketList({ 
  tickets: initialTickets, 
  onEditTicket, 
  onOpenKnowledgeBase,
  onSubmitFeedback,
  onSubmitSurvey,
  onBulkStatusUpdate,
  onBulkAssign,
  onBulkTag
}: TicketListProps) {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    mainCategory: 'all',
    subCategory: 'all',
    priority: 'all',
    status: 'all',
    dateRange: {
      start: null,
      end: null,
    },
    tags: [],
    hasAttachments: null
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [bulkStatusValue, setBulkStatusValue] = useState<string>("");
  const [bulkAssignValue, setBulkAssignValue] = useState<string>("");
  const [bulkTagValue, setBulkTagValue] = useState<string>("");

  // Extract unique values for filters
  const uniqueValues = useMemo(() => ({
    mainCategories: Array.from(new Set(tickets.map(t => t.category.main))),
    subCategories: Array.from(new Set(tickets.map(t => t.category.sub))),
    priorities: Array.from(new Set(tickets.map(t => t.priority))),
    statuses: Array.from(new Set(tickets.map(t => t.status))),
    tags: Array.from(new Set(tickets.flatMap(t => t.tags)))
  }), [tickets]);

  // Enhanced filter function with full-text search
  const filterTickets = (tickets: Ticket[]) => {
    return tickets.filter(ticket => {
      const searchText = filters.search.toLowerCase();
      const matchesSearch = !searchText || 
        ticket.searchableText?.toLowerCase().includes(searchText) ||
        ticket.title.toLowerCase().includes(searchText) ||
        ticket.description?.toLowerCase().includes(searchText) ||
        ticket.id.toLowerCase().includes(searchText);

      const matchesMainCategory = filters.mainCategory === 'all' || 
        ticket.category.main === filters.mainCategory;
      const matchesSubCategory = filters.subCategory === 'all' || 
        ticket.category.sub === filters.subCategory;
      const matchesPriority = filters.priority === 'all' || ticket.priority === filters.priority;
      const matchesStatus = filters.status === 'all' || ticket.status === filters.status;
      
      const matchesDateRange = (!filters.dateRange.start || new Date(ticket.createdAt) >= new Date(filters.dateRange.start)) &&
        (!filters.dateRange.end || new Date(ticket.createdAt) <= new Date(filters.dateRange.end));
      
      const matchesTags = filters.tags.length === 0 || 
        filters.tags.every(tag => ticket.tags.includes(tag));
      
      const matchesAttachments = filters.hasAttachments === null || 
        (filters.hasAttachments ? ticket.attachments.length > 0 : ticket.attachments.length === 0);

      return matchesSearch && 
        matchesMainCategory && 
        matchesSubCategory && 
        matchesPriority && 
        matchesStatus && 
        matchesDateRange && 
        matchesTags && 
        matchesAttachments;
    });
  };

  // Helper function to get the most recent interaction
  const getLatestInteraction = (ticket: Ticket) => {
    // For demo purposes, return null
    return null;
  };

  // Helper function to check if a ticket needs action
  const needsAction = (ticket: Ticket) => {
    return ticket.status === 'pending';
  };

  // Group tickets by action status
  const groupTickets = (group: ActionGroup) => {
    const baseTickets = (() => {
      switch (group) {
        case 'needs_response':
          return tickets.filter(ticket => needsAction(ticket));
        case 'waiting':
          return tickets.filter(ticket => ticket.status === 'pending');
        case 'in_progress':
          return tickets.filter(ticket => ticket.status === 'in_progress');
        case 'resolved':
          return tickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed');
        default:
          return tickets;
      }
    })();

    return filterTickets(baseTickets);
  };

  // Mock function to get suggested articles - replace with actual API call
  const getSuggestedArticle = (ticket: Ticket) => {
    // Simple mock logic - in reality, this would use AI/ML to find relevant articles
    if (ticket.category.main === 'technical') return { id: 'kb-2', title: 'Common Issues and Solutions' };
    if (ticket.status === 'new') return { id: 'kb-1', title: 'Getting Started with Our Platform' };
    return { id: 'kb-3', title: 'Video Tutorial: Advanced Features' };
  };

  const handleFeedbackSubmit = (feedback: {
    category: string;
    rating: number;
    comment: string;
    suggestions: string;
  }) => {
    if (onSubmitFeedback) {
      onSubmitFeedback(selectedTicketId, feedback);
    }
    setFeedbackFormOpen(false);
  };

  const handleSurveySubmit = async (survey: {
    satisfaction: number;
    resolutionEffective: boolean;
    additionalComments: string;
  }) => {
    if (onSubmitSurvey) {
      await onSubmitSurvey(selectedTicketId, survey);
      // Update the ticket in the local state to mark it as having feedback
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicketId 
            ? { ...ticket, hasFeedback: true }
            : ticket
        )
      );
    }
    setSurveyOpen(false);
    toast({
      title: "Thank you for your feedback!",
      description: "Your feedback helps us improve our service.",
    });
  };

  const openFeedbackForm = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setFeedbackFormOpen(true);
  };

  const openSurvey = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSurveyOpen(true);
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    const newSelected = new Set(selectedTickets);
    if (checked) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allTicketIds = tickets.map(t => t.id);
      setSelectedTickets(new Set(allTicketIds));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleBulkStatusUpdate = () => {
    if (onBulkStatusUpdate && bulkStatusValue && bulkStatusValue !== 'all') {
      onBulkStatusUpdate(Array.from(selectedTickets), bulkStatusValue as TicketStatus);
      setSelectedTickets(new Set());
      setBulkStatusValue("");
    }
  };

  const handleBulkAssign = () => {
    if (onBulkAssign && bulkAssignValue) {
      onBulkAssign(Array.from(selectedTickets), bulkAssignValue);
      setSelectedTickets(new Set());
      setBulkAssignValue("");
    }
  };

  const handleBulkTag = () => {
    if (onBulkTag && bulkTagValue) {
      onBulkTag(Array.from(selectedTickets), bulkTagValue.split(',').map(t => t.trim()));
      setSelectedTickets(new Set());
      setBulkTagValue("");
    }
  };

  // Bulk action handlers
  const bulkActions = {
    markAsResolved: () => {
      const selectedIds = Array.from(selectedTickets);
      onBulkStatusUpdate?.(selectedIds, 'resolved');
      setSelectedTickets(new Set());
    },
    markAsPending: () => {
      const selectedIds = Array.from(selectedTickets);
      onBulkStatusUpdate?.(selectedIds, 'pending');
      setSelectedTickets(new Set());
    },
    assignToAgent: (agentId: string) => {
      const selectedIds = Array.from(selectedTickets);
      onBulkAssign?.(selectedIds, agentId);
      setSelectedTickets(new Set());
    },
    addTags: (tags: string[]) => {
      const selectedIds = Array.from(selectedTickets);
      onBulkTag?.(selectedIds, tags);
      setSelectedTickets(new Set());
    },
    removeTags: (tags: string[]) => {
      const selectedIds = Array.from(selectedTickets);
      const selectedTicketsList = tickets.filter(t => selectedIds.includes(t.id));
      selectedTicketsList.forEach(ticket => {
        const updatedTags = ticket.tags.filter(tag => !tags.includes(tag));
        onBulkTag?.([ticket.id], updatedTags);
      });
      setSelectedTickets(new Set());
    },
    exportSelected: () => {
      const selectedTicketsList = tickets.filter(t => selectedTickets.has(t.id));
      const exportData = selectedTicketsList.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: `${t.category.main}/${t.category.sub}`,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }));
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const renderTicket = (ticket: Ticket) => {
    const latestInteraction = getLatestInteraction(ticket);
    const requiresAction = needsAction(ticket);
    const suggestedArticle = getSuggestedArticle(ticket);
    const isClosedWithoutFeedback = ticket.status === 'closed' && !ticket.hasFeedback;

    return (
      <div
        key={ticket.id}
        className={`${
          viewMode === 'grid'
            ? 'p-6 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            : 'p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <div className={viewMode === 'grid' ? 'flex flex-col flex-1 space-y-3' : 'space-y-4'}>
          {/* Header */}
          <div className={`flex items-start ${viewMode === 'grid' ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
            <div className="min-w-0 flex-1">
              <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'flex-wrap' : ''}`}>
                <Checkbox
                  checked={selectedTickets.has(ticket.id)}
                  onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked === true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-500">#{ticket.id}</span>
                <h4 className="font-medium line-clamp-1">{ticket.title}</h4>
              </div>
              <div className={`flex items-center gap-2 mt-1 ${viewMode === 'grid' ? 'flex-wrap' : ''}`}>
                <Badge variant="secondary">{ticket.priority}</Badge>
                {ticket.category?.main && ticket.category?.sub && (
                  <Badge variant="outline">
                    {`${ticket.category.main.charAt(0).toUpperCase() + ticket.category.main.slice(1)} - ${ticket.category.sub.charAt(0).toUpperCase() + ticket.category.sub.slice(1).replace('_', ' ')}`}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditTicket(ticket)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              {suggestedArticle && onOpenKnowledgeBase && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenKnowledgeBase(suggestedArticle.id)}
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Description Preview in Grid Mode */}
          {viewMode === 'grid' && ticket.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {ticket.description}
            </p>
          )}

          {/* Timeline Preview */}
          {latestInteraction && (
            <TimelinePreview
              interaction={latestInteraction}
              requiresAction={requiresAction}
              onReply={() => onEditTicket(ticket)}
              onViewDetails={() => onEditTicket(ticket)}
            />
          )}

          {/* Feedback Survey Prompt for Closed Tickets */}
          {isClosedWithoutFeedback && (
            <div className="flex items-center justify-between gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  How was your experience? Please provide feedback.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSurvey(ticket.id)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Rate Now
              </Button>
            </div>
          )}

          {/* Knowledge Base Suggestion */}
          {suggestedArticle && onOpenKnowledgeBase && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <BookOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Suggested Article:
              </span>
              <Button
                variant="link"
                className="text-sm p-0 h-auto text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                onClick={() => onOpenKnowledgeBase(suggestedArticle.id)}
              >
                {suggestedArticle.title}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTicketGroup = (tickets: Ticket[]) => {
    if (tickets.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No tickets found matching your criteria
        </div>
      );
    }

    return (
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
          : 'space-y-4'
      }>
        {tickets.map(renderTicket)}
      </div>
    );
  };

  // Update tickets when initialTickets changes
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-8"
            />
          </div>
          <Select
            value={filters.priority}
            onValueChange={(value: string) => 
              setFilters(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {uniqueValues.priorities.map(priority => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value: string) => 
              setFilters(prev => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueValues.statuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.mainCategory}
            onValueChange={(value: string) => 
              setFilters(prev => ({ ...prev, mainCategory: value }))
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueValues.mainCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-9 w-9"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-9 w-9"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTickets.size > 0 && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Select
            value={bulkStatusValue}
            onValueChange={(value: string) => setBulkStatusValue(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="reopened">Reopened</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleBulkStatusUpdate}
            disabled={!bulkStatusValue || bulkStatusValue === 'all'}
          >
            Update Status
          </Button>
        </div>
      )}

      {/* Tickets */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
          : 'space-y-2 divide-y divide-gray-200 dark:divide-gray-800'
      }`}>
        {groupTickets('all').map((ticket) => renderTicket(ticket))}
      </div>

      {/* Feedback Components */}
      <FeedbackForm
        isOpen={feedbackFormOpen}
        onClose={() => setFeedbackFormOpen(false)}
        ticketId={selectedTicketId}
        onSubmit={handleFeedbackSubmit}
      />
      <PostResolutionSurvey
        isOpen={surveyOpen}
        onClose={() => setSurveyOpen(false)}
        ticketId={selectedTicketId}
        onSubmit={handleSurveySubmit}
      />
    </div>
  );
} 