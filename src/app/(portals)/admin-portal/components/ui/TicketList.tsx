'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '@/app/components/StrictModeDroppable';
import { ChevronDownIcon, ChevronUpIcon, Squares2X2Icon as ViewGridIcon, ListBulletIcon as ViewListIcon, TableCellsIcon as ViewBoardsIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FiPlusCircle, FiClock, FiPause, FiCheckCircle, FiArchive, FiCircle, FiBook } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

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
  category?: string;
  assignee?: {
    name: string;
    email: string;
  };
}

interface GroupedTickets {
  [key: string]: Ticket[];
}

interface TicketListProps {
  tickets: Ticket[];
  projectId: string;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>;
  onAssignTicket: (ticketId: string) => void;
  onViewTimeline: (ticket: Ticket) => void;
  onRunAIUpdate?: (ticket: Ticket) => Promise<void>;
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

export default function TicketList({ tickets, projectId, onStatusChange, onAssignTicket, onViewTimeline, onRunAIUpdate }: TicketListProps) {
  const router = useRouter();
  const [ticketView, setTicketView] = useState<'list' | 'grid' | 'kanban'>('list');
  const [ticketSearch, setTicketSearch] = useState('');
  const [showProspectsOnly, setShowProspectsOnly] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [outreachPrompt, setOutreachPrompt] = useState('');
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [groupedTickets, setGroupedTickets] = useState<GroupedTickets>({
    new: [],
    in_progress: [],
    resolved: []
  });
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(ticketSearch.toLowerCase());
    
    if (showProspectsOnly) {
      return ticket.category === 'prospect' && matchesSearch;
    }
    
    return matchesSearch;
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

  // Update grouped tickets when filtered tickets change
  useState(() => {
    const grouped = groupTickets(filteredTickets);
    setGroupedTickets(grouped);
  });

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    if (!result.destination) return;

    const ticketId = result.draggableId;
    const newStatus = result.destination.droppableId as TicketStatus;

    await onStatusChange(ticketId, newStatus);
  };

  const handleOpenOutreachModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowOutreachModal(true);
  };

  const handleCloseOutreachModal = () => {
    setSelectedTicket(null);
    setOutreachPrompt('');
    setShowOutreachModal(false);
  };

  const handleCraftOutreach = async () => {
    if (!selectedTicket || !outreachPrompt) return;
    
    setIsGenerating(true);
    setGenerationError('');
    setGeneratedMessage('');
    
    try {
      const response = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          prompt: outreachPrompt,
          messageType: 'outreach',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            // Update step if provided
            if (data.step) {
              setGenerationStep(data.step);
            }
            
            // Handle error messages from the stream
            if (data.error) {
              throw new Error(data.error);
            }
            
            // Update content if provided
            if (data.content) {
              setGeneratedMessage(data.content);
            }

            // Store metadata if provided
            if (data.metadata) {
              console.log('Message metadata:', data.metadata);
              // You can use this metadata to show additional info about the message
              // like sentiment, intent, keywords, etc.
            }
            
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Only treat as raw content if it's not a JSON parse error
              setGeneratedMessage(prev => prev + chunk);
            } else {
              throw e;
            }
          }
        }
      }

    } catch (error: unknown) {
      console.error('Error generating outreach:', error);
      setGenerationError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while generating the message'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

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
            onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
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
            onClick={() => onAssignTicket(ticket.id)}
            className="text-violet-400 hover:text-violet-300 text-sm"
          >
            Assign
          </button>
          <button
            onClick={() => onViewTimeline(ticket)}
            className="bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 px-3 py-1 rounded-md text-sm"
          >
            Work on it
          </button>
          {ticket.category === 'prospect' && onRunAIUpdate && (
            <button
              onClick={() => onRunAIUpdate(ticket)}
              className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 px-3 py-1 rounded-md text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Update
            </button>
          )}
          {ticket.category === 'prospect' && (
            <button
              onClick={() => handleOpenOutreachModal(ticket)}
              className="bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 px-3 py-1 rounded-md text-sm flex items-center gap-1"
            >
              <FiBook className="w-4 h-4" />
              OutreachGPT
            </button>
          )}
          {ticket.status !== 'resolved' && (
            <button
              onClick={() => onStatusChange(ticket.id, 'resolved')}
              className="bg-green-600/20 text-green-300 hover:bg-green-600/30 px-3 py-1 rounded-md text-sm"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Tickets</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search tickets..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <label className="flex items-center gap-2 text-white/60">
                <input
                  type="checkbox"
                  checked={showProspectsOnly}
                  onChange={(e) => setShowProspectsOnly(e.target.checked)}
                  className="rounded bg-white/5 border-white/20 text-violet-500 focus:ring-violet-500"
                />
                Prospects Only
              </label>
            </div>
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
            {filteredTickets.map((ticket) => renderTicketCard(ticket))}
          </div>
        )}
      </div>

      {/* Outreach Modal */}
      {showOutreachModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg w-full max-w-2xl mx-4 my-8">
            <div className="sticky top-0 bg-gray-900 z-10 border-b border-white/10 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Craft Outreach Message</h3>
                <button
                  onClick={handleCloseOutreachModal}
                  className="text-white/60 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {!generatedMessage && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Describe the message you want to send to {selectedTicket?.title}
                  </label>
                  <textarea
                    value={outreachPrompt}
                    onChange={(e) => setOutreachPrompt(e.target.value)}
                    placeholder="Example: Write a follow-up email highlighting our recent product updates and addressing their previous concerns about pricing..."
                    className="w-full h-32 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              )}

              {isGenerating && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    <span className="text-white/80 font-medium">{generationStep}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {generationError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium">Error</h4>
                      <p className="text-sm text-red-300">{generationError}</p>
                    </div>
                  </div>
                </div>
              )}

              {generatedMessage && !isGenerating && (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-white/80 mb-4">Generated Message</h4>
                    <div className="prose prose-invert max-w-none prose-p:text-base prose-p:leading-relaxed">
                      <ReactMarkdown>
                        {generatedMessage}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-6">
              {!generatedMessage && !isGenerating && (
                <div className="flex justify-end">
                  <button
                    onClick={handleCraftOutreach}
                    disabled={!outreachPrompt.trim()}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-base font-medium"
                  >
                    <FiBook className="w-5 h-5" />
                    Craft My Outreach
                  </button>
                </div>
              )}

              {generatedMessage && !isGenerating && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setGeneratedMessage('');
                      setGenerationError('');
                    }}
                  >
                    Generate Another
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedMessage);
                      toast({
                        title: "Copied to clipboard",
                        description: "Message has been copied to your clipboard",
                      });
                    }}
                  >
                    Copy Message
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 