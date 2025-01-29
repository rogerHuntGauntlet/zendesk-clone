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
import OutreachSequenceList from './OutreachSequenceList';
import { OutreachSequence } from '@/app/types/outreach';
import OutreachSequenceBuilder from './OutreachSequenceBuilder';

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
  const [outreachMode, setOutreachMode] = useState<'single' | 'sequence'>('single');
  const [groupedTickets, setGroupedTickets] = useState<GroupedTickets>({
    new: [],
    in_progress: [],
    resolved: []
  });
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchFilters, setBatchFilters] = useState({
    status: '',
    category: '',
    priority: '',
    lastContactDays: 0
  });
  const [batchPrompt, setBatchPrompt] = useState('');
  const [batchResults, setBatchResults] = useState<any>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [showSequenceBuilder, setShowSequenceBuilder] = useState(false);
  const [sequences, setSequences] = useState<OutreachSequence[]>([]);

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

  const handleBatchGenerate = async () => {
    if (!batchPrompt) return;
    
    setIsBatchGenerating(true);
    setBatchResults(null);
    
    try {
      const response = await fetch('/api/outreach/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          messageType: 'initial',
          filters: batchFilters,
          context: {
            tone: 'professional',
            customFields: {
              prompt: batchPrompt
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate messages');
      }

      const results = await response.json();
      setBatchResults(results);
      
      if (results.successful.length > 0) {
        toast({
          title: "Batch Generation Complete",
          description: `Successfully generated ${results.successful.length} messages`,
        });
      }

    } catch (error: unknown) {
      console.error('Error in batch generation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate messages',
        variant: "destructive"
      });
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleCreateSequence = async (sequence: OutreachSequence) => {
    try {
      const response = await fetch('/api/outreach/sequences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          sequence
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create sequence');
      }

      const newSequence = await response.json();
      setSequences(prev => [...prev, newSequence]);
      toast({
        title: "Success",
        description: "Outreach sequence created successfully",
      });
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create sequence',
        variant: "destructive"
      });
    }
  };

  const handleUpdateSequence = async (sequence: OutreachSequence) => {
    try {
      const response = await fetch(`/api/outreach/sequences/${sequence.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          sequence
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sequence');
      }

      const updatedSequence = await response.json();
      setSequences(prev => prev.map(seq => 
        seq.id === updatedSequence.id ? updatedSequence : seq
      ));
      toast({
        title: "Success",
        description: "Outreach sequence updated successfully",
      });
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update sequence',
        variant: "destructive"
      });
    }
  };

  const handleExecuteSequence = async (sequenceId: string) => {
    try {
      const response = await fetch(`/api/outreach/sequences/${sequenceId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute sequence');
      }

      const updatedSequence = await response.json();
      setSequences(prev => prev.map(seq => 
        seq.id === updatedSequence.id ? updatedSequence : seq
      ));
      toast({
        title: "Success",
        description: "Outreach sequence started successfully",
      });
    } catch (error) {
      console.error('Error executing sequence:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to execute sequence',
        variant: "destructive"
      });
    }
  };

  const handlePauseSequence = async (sequenceId: string) => {
    try {
      const response = await fetch(`/api/outreach/sequences/${sequenceId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to pause sequence');
      }

      const updatedSequence = await response.json();
      setSequences(prev => prev.map(seq => 
        seq.id === updatedSequence.id ? updatedSequence : seq
      ));
      toast({
        title: "Success",
        description: "Outreach sequence paused successfully",
      });
    } catch (error) {
      console.error('Error pausing sequence:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to pause sequence',
        variant: "destructive"
      });
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

  // Replace the existing "Batch Outreach" button with a sequence builder button
  const renderControls = () => (
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
  );

  return (
    <>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Tickets</h2>
          {renderControls()}
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
                <h3 className="text-lg font-semibold text-white">OutreachGPT</h3>
                <button
                  onClick={handleCloseOutreachModal}
                  className="text-white/60 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button
                  variant={outreachMode === 'single' ? 'default' : 'outline'}
                  onClick={() => setOutreachMode('single')}
                  className={outreachMode === 'single' ? 'bg-violet-600' : ''}
                >
                  Single Message
                </Button>
                <Button
                  variant={outreachMode === 'sequence' ? 'default' : 'outline'}
                  onClick={() => setOutreachMode('sequence')}
                  className={outreachMode === 'sequence' ? 'bg-violet-600' : ''}
                >
                  Create Sequence
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {outreachMode === 'single' ? (
                <>
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
                        <textarea
                          value={generatedMessage}
                          onChange={(e) => setGeneratedMessage(e.target.value)}
                          className="w-full h-[300px] px-4 py-3 bg-gray-800 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none overflow-y-auto"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <OutreachSequenceBuilder
                  onSave={(sequence) => {
                    handleCreateSequence(sequence);
                    handleCloseOutreachModal();
                  }}
                  initialSequence={{
                    id: crypto.randomUUID(),
                    name: `Sequence for ${selectedTicket?.title}`,
                    description: '',
                    steps: [],
                    totalDuration: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isActive: false
                  }}
                />
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-6">
              {outreachMode === 'single' && !generatedMessage && !isGenerating && (
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

              {outreachMode === 'single' && generatedMessage && !isGenerating && (
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
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      // TODO: Implement WhatsApp integration
                      toast({
                        title: "WhatsApp Integration",
                        description: "WhatsApp integration coming soon!",
                      });
                    }}
                    className="bg-green-600/20 text-green-300 hover:bg-green-600/30 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Send WhatsApp
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      // TODO: Implement email sending
                      toast({
                        title: "Email Integration",
                        description: "Email integration coming soon!",
                      });
                    }}
                    className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sequence Builder Modal */}
      {showSequenceBuilder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl mx-4 my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Outreach Sequences</h3>
                <button
                  onClick={() => setShowSequenceBuilder(false)}
                  className="text-white/60 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <OutreachSequenceList
                sequences={sequences}
                onCreateSequence={handleCreateSequence}
                onUpdateSequence={handleUpdateSequence}
                onExecuteSequence={handleExecuteSequence}
                onPauseSequence={handlePauseSequence}
              />
            </div>
          </div>
        </div>
      )}

      {/* Batch Generation Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg w-full max-w-2xl mx-4 my-8">
            <div className="sticky top-0 bg-gray-900 z-10 border-b border-white/10 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Batch Generate Outreach Messages</h3>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Status
                  </label>
                  <select
                    value={batchFilters.status}
                    onChange={(e) => setBatchFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="">All Statuses</option>
                    {TICKET_STATUSES.map(status => (
                      <option key={status} value={status}>
                        {getStatusDisplay(status)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Category
                  </label>
                  <select
                    value={batchFilters.category}
                    onChange={(e) => setBatchFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="">All Categories</option>
                    <option value="prospect">Prospects</option>
                    <option value="client">Clients</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Priority
                  </label>
                  <select
                    value={batchFilters.priority}
                    onChange={(e) => setBatchFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Last Contact (Days)
                  </label>
                  <input
                    type="number"
                    value={batchFilters.lastContactDays}
                    onChange={(e) => setBatchFilters(prev => ({ ...prev, lastContactDays: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Message Prompt
                </label>
                <textarea
                  value={batchPrompt}
                  onChange={(e) => setBatchPrompt(e.target.value)}
                  placeholder="Describe the message you want to send to the selected tickets..."
                  className="w-full h-32 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {isBatchGenerating && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    <span className="text-white/80">Generating messages...</span>
                  </div>
                </div>
              )}

              {batchResults && (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white/80 mb-2">Results</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-white/60">Total Messages:</div>
                      <div className="text-white">{batchResults.summary.total}</div>
                      <div className="text-white/60">Successful:</div>
                      <div className="text-green-400">{batchResults.summary.succeeded}</div>
                      <div className="text-white/60">Failed:</div>
                      <div className="text-red-400">{batchResults.summary.failed}</div>
                      <div className="text-white/60">Average Time:</div>
                      <div className="text-white">{Math.round(batchResults.summary.averageGenerationTime)}ms</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBatchModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBatchGenerate}
                  disabled={!batchPrompt.trim() || isBatchGenerating}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
                >
                  {isBatchGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Messages'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 