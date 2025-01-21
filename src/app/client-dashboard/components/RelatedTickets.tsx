import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "lucide-react";
import type { Ticket } from "@/types/tickets";

interface RelatedTicketsProps {
  ticketIds?: string[];
  allTickets: Ticket[];
  onViewTicket: (ticket: Ticket) => void;
}

export function RelatedTickets({ ticketIds = [], allTickets, onViewTicket }: RelatedTicketsProps) {
  return (
    <div className="space-y-4">
      {ticketIds.length ? (
        ticketIds.map((ticketId) => {
          const relatedTicket = allTickets.find(t => t.id === ticketId);
          if (!relatedTicket) return null;

          return (
            <div
              key={ticketId}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Link className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="font-medium">#{ticketId} - {relatedTicket.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{relatedTicket.status}</Badge>
                    <Badge variant="secondary">{relatedTicket.priority}</Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewTicket(relatedTicket)}
              >
                View
              </Button>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 text-gray-500">
          No related tickets found
        </div>
      )}
    </div>
  );
} 