import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { Search, Filter, Link as LinkIcon } from 'lucide-react';
import type { Ticket, TicketInteraction } from "@/types/tickets";

interface ActionListProps {
  tickets: Ticket[];
}

interface GroupedAction {
  date: string;
  actions: {
    time: string;
    ticketId: string;
    ticketTitle: string;
    type: string;
    description: string;
    priority?: string;
    status?: string;
    relatedTickets?: string[];
    resolutionDetails?: string;
    context?: string;
  }[];
}

export function ActionList({ tickets }: ActionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");

  const groupedActions = useMemo(() => {
    const actions: GroupedAction[] = [];
    const actionMap = new Map<string, GroupedAction>();

    tickets.forEach(ticket => {
      // Add ticket creation as an action
      const createdDate = format(parseISO(ticket.createdAt), 'yyyy-MM-dd');
      const createdTime = format(parseISO(ticket.createdAt), 'HH:mm');
      
      if (!actionMap.has(createdDate)) {
        actionMap.set(createdDate, { date: createdDate, actions: [] });
      }
      
      actionMap.get(createdDate)?.actions.push({
        time: createdTime,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        type: 'creation',
        description: 'Ticket created',
        priority: ticket.priority,
        status: ticket.status,
        relatedTickets: ticket.relatedTickets,
        context: `Initial ticket creation with priority ${ticket.priority}`
      });

      // Add all ticket interactions as actions
      ticket.interactions?.forEach((interaction, index, array) => {
        const date = format(parseISO(interaction.timestamp), 'yyyy-MM-dd');
        const time = format(parseISO(interaction.timestamp), 'HH:mm');
        
        if (!actionMap.has(date)) {
          actionMap.set(date, { date, actions: [] });
        }
        
        let description = '';
        let context = '';
        let resolutionDetails = '';

        switch (interaction.type) {
          case 'comment':
            description = `New comment: ${interaction.content}`;
            context = `Comment added in response to previous ${array[index - 1]?.type || 'action'}`;
            break;
          case 'status_change':
            description = `Status changed to ${interaction.metadata?.newValue}`;
            context = `Status updated from ${interaction.metadata?.oldValue} to ${interaction.metadata?.newValue}`;
            break;
          case 'priority_change':
            description = `Priority changed to ${interaction.metadata?.newValue}`;
            context = `Priority escalated from ${interaction.metadata?.oldValue} to ${interaction.metadata?.newValue}`;
            break;
          case 'assignment':
            description = `Assigned to ${interaction.metadata?.newValue}`;
            context = `Ticket ownership transferred to ${interaction.metadata?.newValue}`;
            break;
          case 'resolution':
            description = `Ticket resolved: ${interaction.content}`;
            resolutionDetails = interaction.content;
            context = `Final resolution after ${array.length} interactions`;
            break;
          case 'attachment':
            const files = interaction.metadata?.files?.map(f => f.name).join(', ');
            description = `File uploaded: ${files}`;
            context = `Supporting documentation added: ${files}`;
            break;
        }
        
        actionMap.get(date)?.actions.push({
          time,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          type: interaction.type,
          description,
          priority: ticket.priority,
          status: ticket.status,
          relatedTickets: ticket.relatedTickets,
          resolutionDetails,
          context
        });
      });
    });

    // Convert map to array and sort by date
    return Array.from(actionMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(group => ({
        ...group,
        actions: group.actions.sort((a, b) => b.time.localeCompare(a.time))
      }));
  }, [tickets]);

  // Filter actions based on search query and type
  const filteredGroups = useMemo(() => {
    return groupedActions.map(group => ({
      ...group,
      actions: group.actions.filter(action => {
        const matchesSearch = searchQuery.toLowerCase() === '' ||
          action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.context?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.ticketTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === '' || action.type === filterType;

        return matchesSearch && matchesType;
      })
    })).filter(group => group.actions.length > 0);
  }, [groupedActions, searchQuery, filterType]);

  if (groupedActions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">No actions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="comment">Comments</option>
              <option value="status_change">Status Changes</option>
              <option value="priority_change">Priority Changes</option>
              <option value="assignment">Assignments</option>
              <option value="resolution">Resolutions</option>
              <option value="attachment">File Uploads</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Action Timeline */}
      {filteredGroups.map(group => (
        <Card key={group.date}>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(parseISO(group.date), 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {group.actions.map((action, index) => (
                <div
                  key={`${action.ticketId}-${action.time}-${index}`}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="min-w-[60px] text-sm text-gray-500">
                    {action.time}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        Ticket #{action.ticketId}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm">{action.ticketTitle}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                    
                    {/* Historical Context */}
                    {action.context && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                        Context: {action.context}
                      </p>
                    )}
                    
                    {/* Resolution Details */}
                    {action.resolutionDetails && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Resolution: {action.resolutionDetails}
                        </p>
                      </div>
                    )}
                    
                    {/* Related Tickets */}
                    {action.relatedTickets && action.relatedTickets.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-400" />
                        <div className="flex gap-1">
                          {action.relatedTickets.map(ticketId => (
                            <Badge
                              key={ticketId}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              #{ticketId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {action.status && (
                        <Badge className={
                          action.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                          action.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                          action.status === 'Waiting on Customer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                        }>
                          {action.status}
                        </Badge>
                      )}
                      {action.priority && (
                        <Badge className={
                          action.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                          action.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                          action.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        }>
                          {action.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 