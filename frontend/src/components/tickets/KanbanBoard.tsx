import * as React from "react";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings2, Plus, X, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Ticket } from "@/types";

interface KanbanColumn {
  id: string;
  title: string;
  ticketIds: string[];
  wip_limit?: number;
}

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketUpdate: (ticketId: string, newStatus: string) => Promise<void>;
}

export function KanbanBoard({ tickets, onTicketUpdate }: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isEditingColumns, setIsEditingColumns] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Load column configuration from localStorage or use default
  useEffect(() => {
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      setColumns(JSON.parse(savedColumns));
    } else {
      const defaultColumns: KanbanColumn[] = [
        { id: 'new', title: 'New', ticketIds: [] },
        { id: 'in-progress', title: 'In Progress', ticketIds: [] },
        { id: 'waiting', title: 'Waiting', ticketIds: [] },
        { id: 'resolved', title: 'Resolved', ticketIds: [] }
      ];
      setColumns(defaultColumns);
      localStorage.setItem('kanbanColumns', JSON.stringify(defaultColumns));
    }
  }, []);

  // Distribute tickets to columns based on their status
  useEffect(() => {
    if (columns.length === 0) return;

    const updatedColumns = columns.map(column => ({
      ...column,
      ticketIds: tickets
        .filter(ticket => mapStatusToColumnId(ticket.status) === column.id)
        .map(ticket => ticket.id)
    }));

    setColumns(updatedColumns);
  }, [tickets, columns.length]);

  const mapStatusToColumnId = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'New': 'new',
      'In Progress': 'in-progress',
      'Waiting on Customer': 'waiting',
      'Resolved': 'resolved'
    };
    return statusMap[status] || 'new';
  };

  const mapColumnIdToStatus = (columnId: string): string => {
    const columnMap: { [key: string]: string } = {
      'new': 'New',
      'in-progress': 'In Progress',
      'waiting': 'Waiting on Customer',
      'resolved': 'Resolved'
    };
    return columnMap[columnId] || 'New';
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Check WIP limit
    const destColumn = columns.find(col => col.id === destination.droppableId);
    if (destColumn?.wip_limit && destColumn.ticketIds.length >= destColumn.wip_limit) {
      alert(`WIP limit reached for ${destColumn.title}`);
      return;
    }

    // Update columns
    const newColumns = columns.map(column => {
      if (column.id === source.droppableId) {
        return {
          ...column,
          ticketIds: column.ticketIds.filter(id => id !== draggableId)
        };
      }
      if (column.id === destination.droppableId) {
        const newTicketIds = [...column.ticketIds];
        newTicketIds.splice(destination.index, 0, draggableId);
        return {
          ...column,
          ticketIds: newTicketIds
        };
      }
      return column;
    });

    setColumns(newColumns);

    // Update ticket status
    const newStatus = mapColumnIdToStatus(destination.droppableId);
    await onTicketUpdate(draggableId, newStatus);
  };

  const addColumn = () => {
    if (!newColumnTitle) return;

    const newColumn: KanbanColumn = {
      id: newColumnTitle.toLowerCase().replace(/\s+/g, '-'),
      title: newColumnTitle,
      ticketIds: []
    };

    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    localStorage.setItem('kanbanColumns', JSON.stringify(updatedColumns));
    setNewColumnTitle("");
  };

  const removeColumn = (columnId: string) => {
    const updatedColumns = columns.filter(col => col.id !== columnId);
    setColumns(updatedColumns);
    localStorage.setItem('kanbanColumns', JSON.stringify(updatedColumns));
  };

  const updateColumnWipLimit = (columnId: string, limit: number) => {
    const updatedColumns = columns.map(column => {
      if (column.id === columnId) {
        return { ...column, wip_limit: limit };
      }
      return column;
    });
    setColumns(updatedColumns);
    localStorage.setItem('kanbanColumns', JSON.stringify(updatedColumns));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          onClick={() => setIsEditingColumns(!isEditingColumns)}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Configure Columns
        </Button>
        {isEditingColumns && (
          <div className="flex gap-2">
            <Input
              placeholder="New column name..."
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              className="w-48"
            />
            <Button onClick={addColumn} disabled={!newColumnTitle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-flow-col gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <div key={column.id} className="w-80">
              <div className="bg-secondary p-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {column.title}{' '}
                    <span className="text-sm text-muted-foreground">
                      ({column.ticketIds.length}
                      {column.wip_limit ? `/${column.wip_limit}` : ''})
                    </span>
                  </h3>
                  {isEditingColumns && (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              const limit = prompt('Enter WIP limit (0 for no limit):');
                              if (limit !== null) {
                                updateColumnWipLimit(column.id, parseInt(limit));
                              }
                            }}
                          >
                            Set WIP Limit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeColumn(column.id)}
                            className="text-red-600"
                          >
                            Delete Column
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] p-2 rounded-b-lg ${
                      snapshot.isDraggingOver
                        ? 'bg-secondary/50'
                        : 'bg-secondary/30'
                    }`}
                  >
                    {column.ticketIds.map((ticketId, index) => {
                      const ticket = tickets.find(t => t.id === ticketId);
                      if (!ticket) return null;

                      return (
                        <Draggable
                          key={ticket.id}
                          draggableId={ticket.id}
                          index={index}
                        >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 mb-2 ${
                                snapshot.isDragging
                                  ? 'bg-background shadow-lg'
                                  : 'bg-background'
                              }`}
                            >
                              <h4 className="font-medium text-sm">{ticket.title}</h4>
                              <div className="flex gap-2 mt-2">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                                  ticket.priority === "critical" ? "bg-red-100 text-red-800" :
                                  ticket.priority === "high" ? "bg-orange-100 text-orange-800" :
                                  ticket.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {ticket.client}
                                </span>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 