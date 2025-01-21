import * as React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  ArrowUpCircle,
  Share2,
  BarChart2,
  Filter,
  Layout,
  MessageSquare,
  Brain,
  BookOpen,
  FileText,
  Zap,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Users
} from "lucide-react";
import { Ticket, TicketEvent } from '@/types';

interface TimelineEvent {
  id: string;
  ticketId: string;
  type: 'response' | 'status_change' | 'assignment' | 'sla_alert' | 'resolution' | 
        'priority_change' | 'collaboration' | 'workload_adjustment' | 'customer_response' |
        'smart_filter' | 'kanban_move' | 'ai_analysis' | 'knowledge_base';
  timestamp: string;
  actor: string;
  content: string;
  metadata?: Record<string, any>;
}

interface AIAnalysisMetadata {
  sentiment: {
    customer: string;
    urgency: string;
    tone: string;
  };
  categoryPrediction: Record<string, number>;
  suggestedActions: string[];
  relatedTickets: string[];
  confidenceScore: number;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  relevance: number;
  lastUpdated: string;
  useCount: number;
}

interface KnowledgeBaseMetadata {
  suggestions: KnowledgeBaseArticle[];
  aiMatchConfidence: number;
  searchTerms: string[];
  autoAppliedSolutions: number;
}

interface CustomerResponseMetadata {
  responseType: string;
  attachments: Array<{
    name: string;
    size: string;
    type: string;
  }>;
  responseQuality: Record<string, number>;
  customerContext: {
    previousInteractions: number;
    accountHealth: string;
    lastContact: string;
  };
}

interface PriorityChangeMetadata {
  factors: {
    urgencyScore: number;
    slaImpact: number;
    customerTier: string;
    ticketAge: string;
    keywordAnalysis: Record<string, number>;
    businessImpact: string;
    affectedUsers: number;
    systemAvailability: string;
  };
}

interface WorkloadAdjustmentMetadata {
  currentLoad: string;
  teamMetrics: {
    activeTickets: number;
    availableAgents: number;
    averageHandlingTime: string;
    resourceUtilization: string;
  };
  loadDistribution: Record<string, number>;
}

interface TimelineViewProps {
  ticket: Ticket;
  events: TicketEvent[];
}

export function TimelineView({ ticket, events }: TimelineViewProps) {
  const getEventIcon = (type: TicketEvent['type']) => {
    switch (type) {
      case 'response':
        return <MessageSquare className="h-4 w-4" />;
      case 'assignment':
        return <UserCheck className="h-4 w-4" />;
      case 'status_change':
        return <RefreshCw className="h-4 w-4" />;
      case 'priority_change':
        return <AlertTriangle className="h-4 w-4" />;
      case 'collaboration':
        return <Users className="h-4 w-4" />;
      case 'workload_adjustment':
        return <BarChart2 className="h-4 w-4" />;
      case 'smart_filter':
        return <Filter className="h-4 w-4" />;
      case 'kanban_move':
        return <Layout className="h-4 w-4" />;
      case 'ai_analysis':
        return <Brain className="h-4 w-4" />;
      case 'knowledge_base':
        return <BookOpen className="h-4 w-4" />;
      case 'sla_alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TicketEvent['type']) => {
    switch (type) {
      case 'response':
        return 'bg-blue-100 text-blue-800';
      case 'assignment':
        return 'bg-green-100 text-green-800';
      case 'status_change':
        return 'bg-purple-100 text-purple-800';
      case 'priority_change':
        return 'bg-orange-100 text-orange-800';
      case 'sla_alert':
        return 'bg-red-100 text-red-800';
      case 'collaboration':
        return 'bg-indigo-100 text-indigo-800';
      case 'workload_adjustment':
        return 'bg-cyan-100 text-cyan-800';
      case 'smart_filter':
        return 'bg-emerald-100 text-emerald-800';
      case 'kanban_move':
        return 'bg-violet-100 text-violet-800';
      case 'ai_analysis':
        return 'bg-fuchsia-100 text-fuchsia-800';
      case 'knowledge_base':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMetadata = (type: TicketEvent['type'], metadata: Record<string, any>) => {
    switch (type) {
      case 'status_change':
        return (
          <div className="text-sm text-gray-500">
            <p>From: {metadata.oldStatus}</p>
            <p>To: {metadata.newStatus}</p>
            {metadata.reason && <p>Reason: {metadata.reason}</p>}
          </div>
        );
      case 'priority_change':
        return (
          <div className="text-sm text-gray-500">
            <p>From: {metadata.oldPriority}</p>
            <p>To: {metadata.newPriority}</p>
            {metadata.reason && <p>Reason: {metadata.reason}</p>}
          </div>
        );
      case 'assignment':
        return (
          <div className="text-sm text-gray-500">
            <p>Team: {metadata.team}</p>
            <p>Assigned by: {metadata.assignedBy}</p>
            <p>Match score: {metadata.matchScore * 100}%</p>
          </div>
        );
      case 'response':
        return (
          <div className="text-sm text-gray-500">
            <p>Type: {metadata.responseType}</p>
            <p className="italic">"{metadata.contentPreview}"</p>
          </div>
        );
      case 'sla_alert':
        return (
          <div className="text-sm text-gray-500">
            <p className="font-semibold text-red-600">Time to breach: {metadata.timeToBreachSLA}</p>
            <p>{metadata.recommendedAction}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex items-center gap-x-4">
            <div className={`absolute left-0 flex h-10 w-10 items-center justify-center rounded-full ${getEventColor(event.type)} text-white`}>
              {getEventIcon(event.type)}
            </div>
            <Card className="flex-1 ml-12 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{event.actor}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800">
                      {event.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                  {event.metadata && (
                    <div className="mt-3 border-t pt-3 dark:border-gray-700">
                      {formatMetadata(event.type, event.metadata)}
                    </div>
                  )}
                </div>
                <time className="text-sm text-gray-500 dark:text-gray-400 ml-4 shrink-0">
                  {new Date(event.timestamp).toLocaleString()}
                </time>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 