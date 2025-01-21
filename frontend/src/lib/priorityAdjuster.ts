import type { Ticket } from "@/types";

class PriorityAdjuster {
  adjustTicketPriority(ticket: Ticket): Ticket["priority"] {
    // Simple mock implementation
    const hoursSinceCreation = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 24) return "high";
    if (hoursSinceCreation > 12) return "medium";
    return ticket.priority;
  }
}

export const priorityAdjuster = new PriorityAdjuster(); 