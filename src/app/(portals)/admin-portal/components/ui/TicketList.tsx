'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '@/app/components/StrictModeDroppable';
import { ChevronDownIcon, ChevronUpIcon, Squares2X2Icon as ViewGridIcon, ListBulletIcon as ViewListIcon, TableCellsIcon as ViewBoardsIcon } from '@heroicons/react/24/outline';
import { FiPlusCircle, FiClock, FiPause, FiCheckCircle, FiArchive, FiCircle, FiBook } from 'react-icons/fi';
import { cn } from '@/lib/utils';

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
  const [groupedTickets, setGroupedTickets] = useState<GroupedTickets>({
    new: [],
    in_progress: [],
    resolved: []
  });

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
  );
} 