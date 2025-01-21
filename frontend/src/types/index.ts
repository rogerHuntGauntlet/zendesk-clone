// Base types for the ticket system

// User roles and authentication
export type UserRole = 'admin' | 'employee' | 'client' | 'project_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

// Ticket status flow
export type TicketStatus = 
  | 'new'           // Just created by client
  | 'assigned'      // Assigned to employee by admin
  | 'in_progress'   // Being worked on by employee
  | 'pending'       // Waiting for client response
  | 'resolved'      // Marked as resolved by employee
  | 'closed'        // Confirmed resolved by client
  | 'reopened';     // Reopened by client if issue persists

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

import type { TicketAttachment, TicketInteraction } from './tickets';

export type TicketMainCategory =
  | 'technical'
  | 'billing'
  | 'account'
  | 'feature_request'
  | 'bug_report'
  | 'general'
  | 'security'
  | 'performance';

export type TicketSubCategory = {
  technical: 'api' | 'integration' | 'configuration' | 'connectivity' | 'data' | 'other';
  billing: 'invoice' | 'payment' | 'subscription' | 'refund' | 'pricing' | 'other';
  account: 'access' | 'permissions' | 'profile' | 'settings' | 'authentication' | 'other';
  feature_request: 'new_feature' | 'enhancement' | 'integration' | 'other';
  bug_report: 'ui' | 'functionality' | 'performance' | 'security' | 'other';
  general: 'question' | 'feedback' | 'documentation' | 'other';
  security: 'access' | 'data' | 'vulnerability' | 'incident' | 'other';
  performance: 'speed' | 'reliability' | 'resource_usage' | 'optimization' | 'other';
};

export interface TicketCategory {
  main: TicketMainCategory;
  sub: TicketSubCategory[keyof TicketSubCategory];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;      // User ID
  assignedTo?: string;    // Employee ID
  client: string;         // Client ID
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  category: TicketCategory;  // Updated to use structured categorization
  tags: string[];
  attachments: TicketAttachment[];
  interactions: TicketInteraction[];
  hasFeedback?: boolean;
  searchableText?: string;  // Added for improved full-text search
}

// Comments and communication
export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  createdBy: string;     // User ID
  createdAt: string;
  isInternal: boolean;   // True for employee/admin only comments
  attachments: string[]; // URLs to attached files
}

// Statistics and metrics
export interface TicketStats {
  avgResponseTime: string;
  resolvedCount: number;
  openCount: number;
  satisfactionScore: number;
  totalTickets: number;
  criticalTickets: number;
  slaBreaches: number;
  resolutionRate: number;
  feedbackScore: number;
  activeTickets: number;
  resolvedTickets: number;
  resolvedToday: number;
}

// Employee specific
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

// Client specific
export interface Client extends User {
  company: string;
  plan: 'basic' | 'premium' | 'enterprise';
  totalTickets: number;
  activeTickets: number;
}

// Admin specific
export interface Admin extends User {
  managedDepartments: string[];
  permissions: string[];
}

// Project specific
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  adminId: string;
  employeeCount: number;
  clientCount: number;
  activeTickets: number;
}

export interface ProjectAdmin extends User {
  projects: string[];  // Project IDs
  permissions: string[];
}

// Knowledge Base types
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;      // User ID
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  relatedArticles?: string[];  // Article IDs
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
}

export interface ArticleCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;   // For hierarchical categories
  articleCount: number;
}

export interface ArticleFeedback {
  id: string;
  articleId: string;
  userId: string;
  isHelpful: boolean;
  comment?: string;
  createdAt: string;
}

// Time Tracking types
export interface TimeEntry {
  id: string;
  ticketId: string;
  userId: string;      // Employee ID
  startTime: string;
  endTime?: string;    // Null if timer is running
  duration: number;    // In seconds
  description: string;
  category: TimeCategory;
  billable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TimeCategory = 
  | 'research'
  | 'development'
  | 'communication'
  | 'documentation'
  | 'review'
  | 'meeting'
  | 'other';

export interface TimeStats {
  totalTime: number;           // In seconds
  billableTime: number;        // In seconds
  nonBillableTime: number;     // In seconds
  categoryBreakdown: Record<TimeCategory, number>;
  dailyStats: Array<{
    date: string;
    totalTime: number;
    billableTime: number;
  }>;
}

export interface CostEntry {
  id: string;
  ticketId: string;
  amount: number;
  description: string;
  category: string;
}

export interface LearningProgress {
  id: string;
  type: 'article_view' | 'article_feedback';
  articleId: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export * from './tickets';
export * from './profile'; 