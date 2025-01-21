import type { Ticket, TicketComment, TicketStats, TimeEntry, CostEntry } from "@/types/tickets";
import { employeeManager } from "./employees";

interface TimeEntriesFilter {
  ticketId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

interface IAPI {
  getTickets(): Promise<Ticket[]>;
  getTicketStats(): Promise<TicketStats>;
  addResponse(ticketId: string, content: string): Promise<TicketComment>;
  getTimeEntries(filter: TimeEntriesFilter): Promise<TimeEntry[]>;
  getCostEntries(ticketId: string): Promise<CostEntry[]>;
  createTicket(data: {
    title: string;
    description: string;
    priority: Ticket["priority"];
    category: string;
    attachments: File[];
  } & Partial<Pick<Ticket, "createdBy" | "client" | "tags">>): Promise<Ticket>;
}

export class API implements IAPI {
  async getTickets(): Promise<Ticket[]> {
    return [];
  }

  async getTicketStats(): Promise<TicketStats> {
    return {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      avgResponseTime: "0h",
      avgResolutionTime: "0h"
    };
  }

  async addResponse(ticketId: string, content: string): Promise<TicketComment> {
    return {
      id: "comment-1",
      ticketId,
      content,
      createdAt: new Date().toISOString(),
      createdBy: "user-1"
    };
  }

  async getTimeEntries(filter: TimeEntriesFilter): Promise<TimeEntry[]> {
    return [];
  }

  async getCostEntries(ticketId: string): Promise<CostEntry[]> {
    return [];
  }

  async createTicket(data: {
    title: string;
    description: string;
    priority: Ticket["priority"];
    category: string;
    attachments: File[];
  } & Partial<Pick<Ticket, "createdBy" | "client" | "tags">>): Promise<Ticket> {
    // TODO: Implement actual file upload logic here
    const attachmentUrls = data.attachments.map(file => URL.createObjectURL(file));
    
    return {
      id: "ticket-" + Date.now(),
      ...data,
      attachments: attachmentUrls,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || "current-user",
      client: data.client || "current-client",
      tags: data.tags || []
    };
  }
}

const api = new API();
export { api, employeeManager }; 