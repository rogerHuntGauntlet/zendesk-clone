export type UserRole = 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string;
  client: string;
  category?: string;
  tags?: string[];
  attachments?: string[];
  hasFeedback?: boolean;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  attachments?: string[];
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: string;
  avgResolutionTime: string;
}

export interface Employee extends User {
  department: string;
  specialties: string[];
  activeTickets: number;
  performance: {
    resolvedTickets: number;
    avgResponseTime: string;
    customerRating: number;
  };
}

export interface Client extends User {
  company: string;
  activeTickets: number;
  totalTickets: number;
}

export interface Admin extends User {
  department: string;
  managedTeams: string[];
}

export interface TimeEntry {
  id: string;
  ticketId: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
  category: string;
  billable: boolean;
}

export interface CostEntry {
  id: string;
  ticketId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  approvedBy?: string;
}

export interface TicketAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TicketInteraction {
  id: string;
  type: 'comment' | 'status_change' | 'assignment' | 'attachment';
  content: string;
  createdBy: User;
  createdAt: string;
  isInternal?: boolean;
  attachments?: TicketAttachment[];
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    oldAssignee?: User;
    newAssignee?: User;
  };
}

export interface MentionSuggestion {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface ShareTicketData {
  users: string[];
  message?: string;
  includeAttachments: boolean;
  includeHistory: boolean;
  expiresAt?: string;
} 