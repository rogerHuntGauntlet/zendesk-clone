import type { 
  Ticket, 
  TicketComment, 
  TicketStats,
  User,
  Employee,
  Client,
  Admin,
  Project,
  ProjectAdmin,
  TicketStatus,
  TicketPriority,
  KnowledgeArticle,
  ArticleCategory,
  ArticleFeedback,
  TimeEntry,
  TimeStats,
  TimeCategory,
  CostEntry,
  LearningProgress,
  TicketAttachment,
  TicketCategory
} from '@/types';

// For demo purposes, we'll use localStorage to persist data
const STORAGE_KEYS = {
  TICKETS: 'tickets',
  USERS: 'users',
  COMMENTS: 'comments',
  ARTICLES: 'knowledge_articles',
  CATEGORIES: 'article_categories',
  FEEDBACK: 'article_feedback',
  TIME_ENTRIES: 'time_entries',
  LEARNING_PROGRESS: 'learning_progress',
  PROJECTS: 'projects'
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to get current timestamp
const now = () => new Date().toISOString();

interface SearchTicketsParams {
  query?: string;
  status?: string;
  assignedTo?: string;
}

class API {
  private initialized = false;

  private initialize() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
  }

  // User Operations
  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    this.initialize();
    // In a real app, this would use an auth token
    // For demo, we'll use a stored user ID
    const userId = localStorage.getItem('currentUserId');
    if (!userId) return null;
    
    const users = this.getStoredUsers();
    return users.find(u => u.id === userId) || null;
  }

  async login(email: string, password: string): Promise<User> {
    if (typeof window === 'undefined') throw new Error('Cannot login during SSR');
    this.initialize();
    // In a real app, this would validate credentials
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    
    localStorage.setItem('currentUserId', user.id);
    return user;
  }

  async logout(): Promise<void> {
    if (typeof window === 'undefined') return;
    this.initialize();
    localStorage.removeItem('currentUserId');
  }

  // Admin Operations
  async getEmployeeList(): Promise<Employee[]> {
    const users = this.getStoredUsers();
    return users.filter(u => u.role === 'employee') as Employee[];
  }

  async getClientList(): Promise<Client[]> {
    const users = this.getStoredUsers();
    return users.filter(u => u.role === 'client') as Client[];
  }

  async assignTicketToEmployee(ticketId: string, employeeId: string): Promise<Ticket> {
    return this.updateTicket(ticketId, {
      assignedTo: employeeId,
      status: 'assigned',
      updatedAt: now()
    });
  }

  // Employee Operations
  async getAssignedTickets(employeeId: string): Promise<Ticket[]> {
    const tickets = this.getStoredTickets();
    return tickets.filter(t => t.assignedTo === employeeId);
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, comment?: string): Promise<Ticket> {
    const updates: Partial<Ticket> = { status };
    
    if (status === 'resolved') {
      updates.resolvedAt = now();
    } else if (status === 'closed') {
      updates.closedAt = now();
    }

    const ticket = await this.updateTicket(ticketId, updates);

    if (comment) {
      await this.addComment({
        ticketId,
        content: comment,
        createdBy: (await this.getCurrentUser())?.id || '',
        isInternal: false,
        attachments: []
      });
    }

    return ticket;
  }

  // Client Operations
  async getClientTickets(clientId: string): Promise<Ticket[]> {
    const tickets = this.getStoredTickets();
    return tickets.filter(t => t.client === clientId);
  }

  async createClientTicket(data: {
    title: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
    attachments?: TicketAttachment[];
  }): Promise<Ticket> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'client') {
      throw new Error('Only clients can create tickets');
    }

    return this.createTicket({
      ...data,
      createdBy: currentUser.id,
      client: currentUser.id,
      tags: [],
      attachments: data.attachments || [],
      interactions: []
    });
  }

  // Ticket Operations
  async createTicket(data: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const tickets = this.getStoredTickets();
    const newTicket: Ticket = {
      ...data,
      id: generateId(),
      status: 'new',
      createdAt: now(),
      updatedAt: now(),
      tags: data.tags || [],
      attachments: data.attachments || [],
    };
    
    tickets.push(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    return newTicket;
  }

  async getTickets(filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    search?: string;
  }): Promise<Ticket[]> {
    let tickets = this.getStoredTickets();
    
    if (filters) {
      if (filters.status) {
        tickets = tickets.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        tickets = tickets.filter(t => t.priority === filters.priority);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        tickets = tickets.filter(t => 
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
        );
      }
    }
    
    return tickets;
  }

  async getTicket(id: string): Promise<Ticket | null> {
    const ticket = this.getStoredTickets().find(t => t.id === id);
    return ticket || null;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const tickets = this.getStoredTickets();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Ticket not found');

    const updatedTicket = {
      ...tickets[index],
      ...updates,
      updatedAt: now(),
    };
    
    tickets[index] = updatedTicket;
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    return updatedTicket;
  }

  // Comment Operations
  async addComment(data: Omit<TicketComment, 'id' | 'createdAt'>): Promise<TicketComment> {
    const comments = this.getStoredComments();
    const newComment: TicketComment = {
      ...data,
      id: generateId(),
      createdAt: now(),
    };
    
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    return newComment;
  }

  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    return this.getStoredComments().filter(c => c.ticketId === ticketId);
  }

  // Stats Operations
  async getTicketStats(): Promise<TicketStats> {
    const tickets = this.getStoredTickets();
    const today = new Date().toDateString();

    const resolvedOrClosed = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    const active = tickets.filter(t => t.status !== 'closed');
    const critical = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed');
    const resolvedToday = tickets.filter(t => 
      (t.status === 'resolved' || t.status === 'closed') && 
      new Date(t.updatedAt).toDateString() === today
    );

    return {
      avgResponseTime: '2h 34m',
      resolvedCount: resolvedOrClosed.length,
      openCount: active.length,
      satisfactionScore: 4.5,
      totalTickets: tickets.length,
      criticalTickets: critical.length,
      slaBreaches: 0,
      resolutionRate: resolvedOrClosed.length / tickets.length * 100,
      resolvedToday: resolvedToday.length,
      feedbackScore: 4.5,
      activeTickets: active.length,
      resolvedTickets: resolvedOrClosed.length
    };
  }

  // Knowledge Base Operations
  async createArticle(data: Omit<KnowledgeArticle, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'helpfulCount' | 'notHelpfulCount'>): Promise<KnowledgeArticle> {
    const articles = this.getStoredArticles();
    const newArticle: KnowledgeArticle = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0
    };
    
    articles.push(newArticle);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    return newArticle;
  }

  async getArticles(filters?: {
    category?: string;
    tags?: string[];
    status?: KnowledgeArticle['status'];
    search?: string;
  }): Promise<KnowledgeArticle[]> {
    let articles = this.getStoredArticles();
    
    if (filters) {
      if (filters.category) {
        articles = articles.filter(a => a.category === filters.category);
      }
      if (filters.tags?.length) {
        articles = articles.filter(a => 
          filters.tags!.some(tag => a.tags.includes(tag))
        );
      }
      if (filters.status) {
        articles = articles.filter(a => a.status === filters.status);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        articles = articles.filter(a => 
          a.title.toLowerCase().includes(search) ||
          a.content.toLowerCase().includes(search) ||
          a.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }
    }
    
    return articles;
  }

  async getArticle(id: string): Promise<KnowledgeArticle | null> {
    const articles = this.getStoredArticles();
    const article = articles.find(a => a.id === id);
    if (article) {
      // Update view count
      article.viewCount++;
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    }
    return article || null;
  }

  async updateArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const articles = this.getStoredArticles();
    const index = articles.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Article not found');

    const updatedArticle = {
      ...articles[index],
      ...updates,
      updatedAt: now()
    };
    
    articles[index] = updatedArticle;
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    return updatedArticle;
  }

  async submitArticleFeedback(data: Omit<ArticleFeedback, 'id' | 'createdAt'>): Promise<ArticleFeedback> {
    const feedback = this.getStoredFeedback();
    const articles = this.getStoredArticles();
    
    const newFeedback: ArticleFeedback = {
      ...data,
      id: generateId(),
      createdAt: now()
    };
    
    // Update article helpful counts
    const article = articles.find(a => a.id === data.articleId);
    if (article) {
      if (data.isHelpful) {
        article.helpfulCount++;
      } else {
        article.notHelpfulCount++;
      }
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    }
    
    feedback.push(newFeedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));
    return newFeedback;
  }

  // Time Tracking Operations
  async startTimeEntry(data: {
    ticketId: string;
    userId: string;
    description: string;
    category: TimeCategory;
    billable: boolean;
  }): Promise<TimeEntry> {
    const entries = this.getStoredTimeEntries();
    
    // Check if there's already a running timer for this user
    const runningEntry = entries.find(e => e.userId === data.userId && !e.endTime);
    if (runningEntry) {
      throw new Error('User already has a running timer');
    }

    const newEntry: TimeEntry = {
      ...data,
      id: generateId(),
      startTime: now(),
      duration: 0,
      createdAt: now(),
      updatedAt: now()
    };
    
    entries.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
    return newEntry;
  }

  async stopTimeEntry(id: string): Promise<TimeEntry> {
    const entries = this.getStoredTimeEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Time entry not found');

    const entry = entries[index];
    if (entry.endTime) throw new Error('Timer already stopped');

    const endTime = now();
    const duration = Math.floor(
      (new Date(endTime).getTime() - new Date(entry.startTime).getTime()) / 1000
    );

    const updatedEntry = {
      ...entry,
      endTime,
      duration,
      updatedAt: now()
    };
    
    entries[index] = updatedEntry;
    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
    return updatedEntry;
  }

  async getTimeEntries(filters?: {
    ticketId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeEntry[]> {
    let entries = this.getStoredTimeEntries();
    
    if (filters) {
      if (filters.ticketId) {
        entries = entries.filter(e => e.ticketId === filters.ticketId);
      }
      if (filters.userId) {
        entries = entries.filter(e => e.userId === filters.userId);
      }
      if (filters.startDate) {
        entries = entries.filter(e => e.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        entries = entries.filter(e => e.startTime <= filters.endDate!);
      }
    }
    
    return entries;
  }

  async getTimeStats(userId: string, startDate?: string, endDate?: string): Promise<TimeStats> {
    const entries = await this.getTimeEntries({ userId, startDate, endDate });
    
    const stats: TimeStats = {
      totalTime: 0,
      billableTime: 0,
      nonBillableTime: 0,
      categoryBreakdown: {
        research: 0,
        development: 0,
        communication: 0,
        documentation: 0,
        review: 0,
        meeting: 0,
        other: 0
      },
      dailyStats: []
    };

    // Calculate totals and category breakdown
    entries.forEach(entry => {
      const duration = entry.duration;
      stats.totalTime += duration;
      if (entry.billable) {
        stats.billableTime += duration;
      } else {
        stats.nonBillableTime += duration;
      }
      stats.categoryBreakdown[entry.category] += duration;
    });

    // Calculate daily stats
    const dailyMap = new Map<string, { total: number; billable: number }>();
    entries.forEach(entry => {
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      const current = dailyMap.get(date) || { total: 0, billable: 0 };
      current.total += entry.duration;
      if (entry.billable) {
        current.billable += entry.duration;
      }
      dailyMap.set(date, current);
    });

    stats.dailyStats = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      totalTime: stats.total,
      billableTime: stats.billable
    }));

    return stats;
  }

  async getCostEntries(ticketId: string): Promise<CostEntry[]> {
    // For demo purposes, return empty array
    return [];
  }

  async addTimeEntry(ticketId: string, entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    const timeEntries = this.getStoredTimeEntries();
    const newEntry: TimeEntry = {
      ...entry,
      id: generateId(),
      ticketId,
      createdAt: now(),
      updatedAt: now(),
      duration: 0, // Will be calculated when entry is stopped
    };
    
    timeEntries.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(timeEntries));
    return newEntry;
  }

  async addCostEntry(ticketId: string, entry: Omit<CostEntry, 'id'>): Promise<CostEntry> {
    // For demo purposes, return mock entry
    return {
      id: generateId(),
      ticketId,
      amount: entry.amount,
      description: entry.description,
      category: entry.category
    };
  }

  async submitFeedback(ticketId: string, feedback: {
    category: string;
    rating: number;
    comment: string;
    suggestions: string;
  }): Promise<void> {
    // For demo purposes, just log the feedback
    console.log('Feedback submitted:', { ticketId, feedback });
  }

  async submitResolutionSurvey(ticketId: string, survey: {
    satisfaction: number;
    resolutionEffective: boolean;
    additionalComments: string;
  }): Promise<void> {
    // For demo purposes, just log the survey
    console.log('Resolution survey submitted:', { ticketId, survey });
  }

  async updateTickets(ticketIds: string[], updates: Partial<Ticket>): Promise<void> {
    const tickets = this.getStoredTickets();
    const updatedTickets = tickets.map(ticket => {
      if (ticketIds.includes(ticket.id)) {
        return {
          ...ticket,
          ...updates,
          updatedAt: now()
        };
      }
      return ticket;
    });
    
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
  }

  // Learning Progress Operations
  async trackLearningProgress(data: {
    type: 'article_view' | 'article_feedback';
    articleId: string;
    userId: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const progress = this.getStoredLearningProgress();
    const entry: LearningProgress = {
      id: generateId(),
      ...data
    };
    
    progress.push(entry);
    localStorage.setItem(STORAGE_KEYS.LEARNING_PROGRESS, JSON.stringify(progress));

    // Update article stats if it's a view
    if (data.type === 'article_view') {
      const article = await this.getArticle(data.articleId);
      if (article) {
        await this.updateArticle(data.articleId, {
          viewCount: (article.viewCount || 0) + 1
        });
      }
    }
  }

  async getLearningProgress(userId: string): Promise<LearningProgress[]> {
    const progress = this.getStoredLearningProgress();
    return progress.filter(p => p.userId === userId);
  }

  // Helper methods to get stored data
  private getStoredTickets(): Ticket[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const ticketsJson = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!ticketsJson) return [];
    try {
      return JSON.parse(ticketsJson);
    } catch (error) {
      console.error('Failed to parse tickets from localStorage:', error);
      return [];
    }
  }

  private getStoredUsers(): User[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!usersJson) return [];
    try {
      return JSON.parse(usersJson);
    } catch (error) {
      console.error('Failed to parse users from localStorage:', error);
      return [];
    }
  }

  private getStoredComments(): TicketComment[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const commentsJson = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!commentsJson) return [];
    try {
      return JSON.parse(commentsJson);
    } catch (error) {
      console.error('Failed to parse comments from localStorage:', error);
      return [];
    }
  }

  private getStoredArticles(): KnowledgeArticle[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const articlesJson = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    if (!articlesJson) return [];
    try {
      return JSON.parse(articlesJson);
    } catch (error) {
      console.error('Failed to parse articles from localStorage:', error);
      return [];
    }
  }

  private getStoredFeedback(): ArticleFeedback[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const stored = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredTimeEntries(): TimeEntry[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const stored = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredLearningProgress(): LearningProgress[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const stored = localStorage.getItem(STORAGE_KEYS.LEARNING_PROGRESS);
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return stored ? JSON.parse(stored) : [];
  }

  async getCurrentEmployee(): Promise<Employee | null> {
    try {
      // In a real implementation, this would check the session/token
      // and return the authenticated employee data
      return null;
    } catch (error) {
      console.error('Error getting current employee:', error);
      return null;
    }
  }

  async getEmployeeTickets(employeeId: string): Promise<Ticket[]> {
    try {
      // In a real implementation, this would fetch tickets from the backend
      return [];
    } catch (error) {
      console.error('Error getting employee tickets:', error);
      return [];
    }
  }

  async getEmployeeStats(employeeId: string): Promise<TicketStats> {
    try {
      return {
        avgResponseTime: '0m',
        resolvedCount: 0,
        openCount: 0,
        satisfactionScore: 0,
        totalTickets: 0,
        criticalTickets: 0,
        slaBreaches: 0,
        resolutionRate: 0,
        resolvedToday: 0,
        feedbackScore: 0,
        activeTickets: 0,
        resolvedTickets: 0
      };
    } catch (error) {
      console.error('Error getting employee stats:', error);
      throw error;
    }
  }

  async searchTickets(params: SearchTicketsParams): Promise<Ticket[]> {
    try {
      // In a real implementation, this would search tickets from the backend
      return [];
    } catch (error) {
      console.error('Error searching tickets:', error);
      return [];
    }
  }

  // Project Admin Operations
  async getProjects(adminId: string): Promise<Project[]> {
    const projects = this.getStoredProjects();
    return projects.filter(p => p.adminId === adminId);
  }

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'employeeCount' | 'clientCount' | 'activeTickets'>): Promise<Project> {
    const projects = this.getStoredProjects();
    const newProject: Project = {
      ...data,
      id: generateId(),
      createdAt: now(),
      employeeCount: 0,
      clientCount: 0,
      activeTickets: 0
    };
    
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  }

  async getProject(id: string): Promise<Project | null> {
    const project = this.getStoredProjects().find(p => p.id === id);
    return project || null;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const projects = this.getStoredProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');

    const updatedProject = {
      ...projects[index],
      ...updates,
    };
    
    projects[index] = updatedProject;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return updatedProject;
  }

  async addEmployeeToProject(projectId: string, employeeId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    await this.updateProject(projectId, {
      employeeCount: project.employeeCount + 1
    });

    // In a real app, we would also update employee-project relationships
  }

  async addClientToProject(projectId: string, clientId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    await this.updateProject(projectId, {
      clientCount: project.clientCount + 1
    });

    // In a real app, we would also update client-project relationships
  }

  async getProjectStats(projectId: string): Promise<TicketStats> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    return {
      avgResponseTime: '0h 0m',
      resolvedCount: 0,
      openCount: project.activeTickets,
      satisfactionScore: 0,
      totalTickets: project.activeTickets,
      criticalTickets: 0,
      slaBreaches: 0,
      resolutionRate: 0,
      resolvedToday: 0,
      feedbackScore: 0,
      activeTickets: project.activeTickets,
      resolvedTickets: 0
    };
  }
}

// Export singleton instance
export const api = new API(); 