import type { 
  User, 
  Admin, 
  Employee, 
  Client, 
  ProjectAdmin,
  Project,
  Ticket, 
  TicketComment,
  TicketStatus,
  TicketPriority,
  KnowledgeArticle,
  ArticleCategory,
  ArticleFeedback,
  TimeEntry,
  LearningProgress
} from '@/types';

const STORAGE_KEYS = {
  TICKETS: 'tickets',
  USERS: 'users',
  COMMENTS: 'comments',
  ARTICLES: 'knowledge_articles',
  CATEGORIES: 'article_categories',
  FEEDBACK: 'article_feedback',
  TIME_ENTRIES: 'time_entries',
  LEARNING_PROGRESS: 'learning_progress',
  COURSES: 'courses',
  PROJECTS: 'projects'
};

// Mock Users
const mockAdmins: Admin[] = [
  {
    id: 'admin-1',
    email: 'admin@rogercorp.com',
    name: 'Roger Admin',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T09:00:00Z',
    managedDepartments: ['Technical Support', 'Customer Success'],
    permissions: ['manage_users', 'assign_tickets', 'view_analytics']
  }
];

const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    email: 'roger@employee.com',
    name: 'Roger Employee',
    role: 'employee',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T08:30:00Z',
    department: 'Technical Support',
    specialties: ['JavaScript', 'React', 'Node.js'],
    activeTickets: 2,
    performance: {
      resolvedTickets: 45,
      avgResponseTime: '2h 15m',
      customerRating: 4.8
    }
  },
  {
    id: 'emp-2',
    email: 'alice@employee.com',
    name: 'Alice Smith',
    role: 'employee',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T08:45:00Z',
    department: 'Customer Success',
    specialties: ['Account Management', 'Onboarding', 'Training'],
    activeTickets: 2,
    performance: {
      resolvedTickets: 38,
      avgResponseTime: '1h 45m',
      customerRating: 4.9
    }
  },
  {
    id: 'emp-3',
    email: 'bob@employee.com',
    name: 'Bob Johnson',
    role: 'employee',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T08:50:00Z',
    department: 'Technical Support',
    specialties: ['Database', 'Security', 'Cloud Infrastructure'],
    activeTickets: 1,
    performance: {
      resolvedTickets: 42,
      avgResponseTime: '2h 00m',
      customerRating: 4.7
    }
  },
  {
    id: 'emp-4',
    email: 'carol@employee.com',
    name: 'Carol Williams',
    role: 'employee',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T09:00:00Z',
    department: 'Customer Success',
    specialties: ['Product Training', 'Documentation', 'User Experience'],
    activeTickets: 2,
    performance: {
      resolvedTickets: 35,
      avgResponseTime: '1h 30m',
      customerRating: 4.9
    }
  },
  {
    id: 'emp-5',
    email: 'dave@employee.com',
    name: 'Dave Brown',
    role: 'employee',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T09:15:00Z',
    department: 'Technical Support',
    specialties: ['Mobile Apps', 'API Integration', 'Performance'],
    activeTickets: 1,
    performance: {
      resolvedTickets: 40,
      avgResponseTime: '2h 30m',
      customerRating: 4.6
    }
  }
];

const mockClients: Client[] = [
  {
    id: 'client-1',
    email: 'roger@rogercorp.com',
    name: 'Roger Corp',
    role: 'client',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T10:00:00Z',
    company: 'Roger Corporation',
    plan: 'enterprise',
    totalTickets: 8,
    activeTickets: 3
  }
];

// Mock Project Admins
const mockProjectAdmins: ProjectAdmin[] = [
  {
    id: 'project-admin-1',
    email: 'admin@ohfpartners.com',
    name: 'Roger Project Admin',
    role: 'project_admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-21T09:00:00Z',
    projects: ['project-1', 'project-2'],
    permissions: ['manage_projects', 'manage_users', 'view_analytics']
  }
];

// Mock Projects
const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Tech Support Hub',
    description: 'Technical support for our SaaS products',
    createdAt: '2024-01-01T00:00:00Z',
    adminId: 'project-admin-1',
    employeeCount: 5,
    clientCount: 20,
    activeTickets: 15
  },
  {
    id: 'project-2',
    name: 'Customer Success Center',
    description: 'Customer success and account management',
    createdAt: '2024-01-01T00:00:00Z',
    adminId: 'project-admin-1',
    employeeCount: 3,
    clientCount: 10,
    activeTickets: 8
  }
];

// Combine all users
const mockUsers: User[] = [...mockAdmins, ...mockEmployees, ...mockClients, ...mockProjectAdmins];

// Mock Tickets
const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Mobile App Performance Issues',
    description: 'Our mobile app is experiencing slow load times during peak hours',
    status: 'assigned',
    priority: 'high',
    createdBy: 'client-1',
    assignedTo: 'emp-1',
    client: 'client-1',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    category: {
      main: 'performance',
      sub: 'speed'
    },
    tags: ['mobile', 'performance', 'optimization'],
    attachments: [{
      id: 'att-1',
      name: 'performance_log.txt',
      url: '/uploads/performance_log.txt',
      size: 1024,
      type: 'text/plain',
      uploadedBy: 'client-1',
      uploadedAt: '2024-01-20T10:00:00Z'
    }],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-2',
    title: 'API Integration Error',
    description: 'Getting 500 errors when trying to integrate with payment gateway',
    status: 'in_progress',
    priority: 'critical',
    createdBy: 'client-1',
    assignedTo: 'emp-1',
    client: 'client-1',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:30:00Z',
    category: {
      main: 'technical',
      sub: 'api'
    },
    tags: ['api', 'payment', 'error'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-3',
    title: 'User Training Request',
    description: 'Need training session for new team members on analytics dashboard',
    status: 'assigned',
    priority: 'medium',
    createdBy: 'client-1',
    assignedTo: 'emp-2',
    client: 'client-1',
    createdAt: '2024-01-19T15:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
    category: {
      main: 'general',
      sub: 'documentation'
    },
    tags: ['training', 'onboarding', 'analytics'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-4',
    title: 'Security Audit Request',
    description: 'Need comprehensive security audit report for compliance',
    status: 'assigned',
    priority: 'high',
    createdBy: 'client-1',
    assignedTo: 'emp-3',
    client: 'client-1',
    createdAt: '2024-01-18T14:00:00Z',
    updatedAt: '2024-01-20T13:00:00Z',
    category: {
      main: 'security',
      sub: 'vulnerability'
    },
    tags: ['security', 'audit', 'compliance'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-5',
    title: 'Custom Report Development',
    description: 'Need custom report for quarterly business metrics',
    status: 'assigned',
    priority: 'medium',
    createdBy: 'client-1',
    assignedTo: 'emp-4',
    client: 'client-1',
    createdAt: '2024-01-21T09:00:00Z',
    updatedAt: '2024-01-21T09:30:00Z',
    category: {
      main: 'feature_request',
      sub: 'new_feature'
    },
    tags: ['reports', 'customization', 'analytics'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-6',
    title: 'Data Migration Support',
    description: 'Need assistance with migrating legacy data to new system',
    status: 'new',
    priority: 'high',
    createdBy: 'client-1',
    client: 'client-1',
    createdAt: '2024-01-21T14:00:00Z',
    updatedAt: '2024-01-21T14:00:00Z',
    category: {
      main: 'technical',
      sub: 'data'
    },
    tags: ['migration', 'data', 'legacy'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-7',
    title: 'User Access Issues',
    description: 'Several team members unable to access admin panel',
    status: 'resolved',
    priority: 'critical',
    createdBy: 'client-1',
    assignedTo: 'emp-3',
    client: 'client-1',
    createdAt: '2024-01-17T11:00:00Z',
    updatedAt: '2024-01-17T16:00:00Z',
    category: { main: 'security', sub: 'access' },
    tags: ['access', 'admin', 'permissions'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-8',
    title: 'PDF Export Feature Request',
    description: 'Need ability to export reports as PDF',
    status: 'new',
    priority: 'medium',
    createdBy: 'client-1',
    client: 'client-1',
    createdAt: '2024-01-21T15:00:00Z',
    updatedAt: '2024-01-21T15:00:00Z',
    category: { main: 'feature_request', sub: 'new_feature' },
    tags: ['feature', 'pdf', 'export'],
    attachments: [{
      id: 'att-3',
      name: 'mockup.png',
      url: '/uploads/mockup.png',
      size: 1536,
      type: 'image/png',
      uploadedBy: 'client-1',
      uploadedAt: '2024-01-21T15:00:00Z'
    }],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-9',
    title: 'Email Notification Setup',
    description: 'Configure automated email notifications for critical events',
    status: 'in_progress',
    priority: 'medium',
    createdBy: 'client-1',
    assignedTo: 'emp-5',
    client: 'client-1',
    createdAt: '2024-01-19T13:00:00Z',
    updatedAt: '2024-01-20T15:00:00Z',
    category: { main: 'technical', sub: 'configuration' },
    tags: ['email', 'notifications', 'automation'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-10',
    title: 'Dashboard Performance Issues',
    description: 'Dashboard loading slowly with large datasets',
    status: 'in_progress',
    priority: 'high',
    createdBy: 'client-1',
    assignedTo: 'emp-5',
    client: 'client-1',
    createdAt: '2024-01-21T16:00:00Z',
    updatedAt: '2024-01-21T16:30:00Z',
    category: { main: 'performance', sub: 'speed' },
    tags: ['dashboard', 'performance', 'optimization'],
    attachments: [{
      id: 'att-4',
      name: 'perf_metrics.csv',
      url: '/uploads/perf_metrics.csv',
      size: 512,
      type: 'text/csv',
      uploadedBy: 'client-1',
      uploadedAt: '2024-01-21T16:00:00Z'
    }],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-11',
    title: 'API Rate Limiting Issue',
    description: 'Hitting API rate limits during peak usage',
    status: 'assigned',
    priority: 'high',
    createdBy: 'client-1',
    assignedTo: 'emp-5',
    client: 'client-1',
    createdAt: '2024-01-21T11:00:00Z',
    updatedAt: '2024-01-21T11:30:00Z',
    category: { main: 'technical', sub: 'api' },
    tags: ['api', 'rate-limit', 'performance'],
    attachments: [],
    interactions: [],
    hasFeedback: false
  },
  {
    id: 'ticket-12',
    title: 'Backup Policy Review',
    description: 'Need review of current backup policies',
    status: 'new',
    priority: 'medium',
    createdBy: 'client-1',
    client: 'client-1',
    createdAt: '2024-01-21T17:00:00Z',
    updatedAt: '2024-01-21T17:00:00Z',
    category: { main: 'security', sub: 'data' },
    tags: ['backup', 'security', 'policy'],
    attachments: [{
      id: 'att-5',
      name: 'current_policy.doc',
      url: '/uploads/current_policy.doc',
      size: 3072,
      type: 'application/msword',
      uploadedBy: 'client-1',
      uploadedAt: '2024-01-21T17:00:00Z'
    }],
    interactions: [],
    hasFeedback: false
  }
];

// Mock Comments
const mockComments: TicketComment[] = [
  {
    id: 'comment-1',
    ticketId: 'ticket-2',
    content: 'I\'ve started investigating the integration issue. Will update shortly.',
    createdBy: 'emp-1',
    createdAt: '2024-01-20T09:35:00Z',
    isInternal: false,
    attachments: []
  },
  {
    id: 'comment-2',
    ticketId: 'ticket-2',
    content: 'Found the issue - Salesforce API token expired. Working on refresh.',
    createdBy: 'emp-1',
    createdAt: '2024-01-20T10:00:00Z',
    isInternal: true,
    attachments: []
  },
  {
    id: 'comment-3',
    ticketId: 'ticket-3',
    content: 'Here\'s a link to our latest API documentation. Let me know if you need anything specific.',
    createdBy: 'emp-1',
    createdAt: '2024-01-20T11:00:00Z',
    isInternal: false,
    attachments: ['api-docs.pdf']
  }
];

// Mock Knowledge Base Categories
const mockCategories: ArticleCategory[] = [
  {
    id: 'cat-1',
    name: 'Getting Started',
    description: 'Basic guides and tutorials for new users',
    articleCount: 3
  },
  {
    id: 'cat-2',
    name: 'Advanced Features',
    description: 'In-depth guides for power users',
    articleCount: 2
  },
  {
    id: 'cat-3',
    name: 'Troubleshooting',
    description: 'Common issues and their solutions',
    articleCount: 2
  },
  {
    id: 'cat-4',
    name: 'Best Practices',
    description: 'Recommended ways to use our platform',
    articleCount: 2
  }
];

// Mock Knowledge Base Articles
const mockArticles: KnowledgeArticle[] = [
  {
    id: 'article-1',
    title: 'Quick Start Guide',
    content: `# Getting Started with Our Platform

Welcome to our support platform! This guide will help you get started quickly.

## First Steps
1. Create your account
2. Set up your profile
3. Configure basic preferences

## Key Features
- Ticket Management
- Knowledge Base
- Live Chat Support
- Learning Resources

Need more help? Contact our support team!`,
    category: 'cat-1',
    tags: ['getting-started', 'basics', 'tutorial'],
    author: 'emp-4',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    status: 'published',
    viewCount: 150,
    helpfulCount: 45,
    notHelpfulCount: 5
  },
  {
    id: 'article-2',
    title: 'Creating Your First Ticket',
    content: `# How to Create a Support Ticket

Learn how to create and manage support tickets effectively.

## Creating a Ticket
1. Click the "New Ticket" button
2. Fill in the required details
3. Add any relevant attachments
4. Submit your ticket

## Best Practices
- Be specific in your description
- Include relevant screenshots
- Choose the appropriate priority level

Our support team will respond as soon as possible!`,
    category: 'cat-1',
    tags: ['tickets', 'support', 'how-to'],
    author: 'emp-2',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    status: 'published',
    viewCount: 120,
    helpfulCount: 38,
    notHelpfulCount: 3
  },
  {
    id: 'article-3',
    title: 'Advanced Search Techniques',
    content: `# Advanced Search Features

Master the advanced search capabilities of our platform.

## Search Operators
- Use quotes for exact matches
- Use AND/OR for complex queries
- Use filters for specific results

## Search Tips
- Start with broad terms
- Use relevant filters
- Sort results effectively

These techniques will help you find information faster!`,
    category: 'cat-2',
    tags: ['search', 'advanced', 'tips'],
    author: 'emp-1',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    status: 'published',
    viewCount: 85,
    helpfulCount: 28,
    notHelpfulCount: 2
  },
  {
    id: 'article-4',
    title: 'Common Error Messages',
    content: `# Understanding Error Messages

A comprehensive guide to common error messages and their solutions.

## Common Errors
1. Authentication Errors
2. Permission Denied
3. Connection Timeout
4. Invalid Input

## Troubleshooting Steps
- Check your credentials
- Verify permissions
- Test network connection
- Validate input format

Contact support if issues persist.`,
    category: 'cat-3',
    tags: ['errors', 'troubleshooting', 'help'],
    author: 'emp-3',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
    status: 'published',
    viewCount: 200,
    helpfulCount: 75,
    notHelpfulCount: 8
  }
];

// Mock Article Feedback
const mockFeedback: ArticleFeedback[] = [
  {
    id: 'feedback-1',
    articleId: 'article-1',
    userId: 'client-1',
    isHelpful: true,
    comment: 'Very clear and helpful guide!',
    createdAt: '2024-01-21T10:00:00Z'
  },
  {
    id: 'feedback-2',
    articleId: 'article-2',
    userId: 'client-1',
    isHelpful: true,
    comment: 'Exactly what I needed to know',
    createdAt: '2024-01-21T11:00:00Z'
  }
];

// Mock Time Entries
const mockTimeEntries: TimeEntry[] = [
  {
    id: 'time-1',
    ticketId: 'ticket-2',
    userId: 'emp-1',
    startTime: '2024-01-20T09:00:00Z',
    endTime: '2024-01-20T10:30:00Z',
    duration: 5400, // 1.5 hours in seconds
    description: 'Investigating integration issue',
    category: 'research',
    billable: true,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'time-2',
    ticketId: 'ticket-2',
    userId: 'emp-1',
    startTime: '2024-01-20T11:00:00Z',
    endTime: '2024-01-20T12:00:00Z',
    duration: 3600, // 1 hour in seconds
    description: 'Implementing fix for integration',
    category: 'development',
    billable: true,
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-01-20T12:00:00Z'
  },
  {
    id: 'time-3',
    ticketId: 'ticket-3',
    userId: 'emp-1',
    startTime: '2024-01-20T14:00:00Z',
    endTime: '2024-01-20T15:00:00Z',
    duration: 3600, // 1 hour in seconds
    description: 'Documentation review and updates',
    category: 'documentation',
    billable: false,
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T15:00:00Z'
  }
];

// Mock Learning Progress
const mockLearningProgress: LearningProgress[] = [
  {
    id: 'progress-1',
    type: 'article_view',
    articleId: 'article-1',
    userId: 'client-1',
    timestamp: '2024-01-21T09:00:00Z'
  },
  {
    id: 'progress-2',
    type: 'article_feedback',
    articleId: 'article-1',
    userId: 'client-1',
    timestamp: '2024-01-21T09:05:00Z',
    metadata: { isHelpful: true }
  },
  {
    id: 'progress-3',
    type: 'article_view',
    articleId: 'article-2',
    userId: 'client-1',
    timestamp: '2024-01-21T10:00:00Z'
  },
  {
    id: 'progress-4',
    type: 'article_feedback',
    articleId: 'article-2',
    userId: 'client-1',
    timestamp: '2024-01-21T10:05:00Z',
    metadata: { isHelpful: true }
  }
];

// Mock Courses
const mockCourses = [
  {
    id: "kb-course",
    title: "Knowledge Base Mastery",
    description: "Learn through exploring our knowledge base articles",
    duration: "Self-paced",
    category: "Knowledge Base",
    type: 'knowledge-base',
    progress: 0,
    modules: [
      {
        id: "kb-basics",
        title: "Getting Started Articles",
        type: "interactive",
        duration: "Self-paced",
        completed: false,
        steps: [
          {
            id: "kb-start-1",
            title: "Platform Basics",
            completed: false,
            content: "Learn the fundamentals of our platform through essential articles",
            requiredArticles: ["article-1", "article-2"]
          }
        ]
      },
      {
        id: "kb-advanced",
        title: "Advanced Topics",
        type: "interactive",
        duration: "Self-paced",
        completed: false,
        steps: [
          {
            id: "kb-adv-1",
            title: "Advanced Features",
            completed: false,
            content: "Master advanced features and troubleshooting",
            requiredArticles: ["article-3", "article-4"]
          }
        ]
      }
    ]
  },
  {
    id: "support-basics",
    title: "Support Portal Essentials",
    description: "Master the fundamentals of using our support portal",
    duration: "2 hours",
    category: "Basics",
    type: 'standard',
    progress: 0,
    modules: [
      {
        id: "basics-1",
        title: "Portal Navigation",
        type: "video",
        duration: "15 mins",
        completed: false
      },
      {
        id: "basics-2",
        title: "Creating Support Tickets",
        type: "interactive",
        duration: "30 mins",
        completed: false,
        steps: [
          {
            id: "ticket-1",
            title: "Ticket Creation Basics",
            completed: false,
            content: "Learn how to create effective support tickets"
          },
          {
            id: "ticket-2",
            title: "Adding Details",
            completed: false,
            content: "Best practices for providing ticket information"
          }
        ]
      },
      {
        id: "basics-3",
        title: "Understanding Support Levels",
        type: "quiz",
        duration: "15 mins",
        completed: false
      }
    ]
  },
  {
    id: "advanced-support",
    title: "Advanced Support Features",
    description: "Learn advanced features and best practices",
    duration: "3 hours",
    category: "Advanced",
    type: 'standard',
    progress: 0,
    modules: [
      {
        id: "adv-1",
        title: "Advanced Search Techniques",
        type: "video",
        duration: "20 mins",
        completed: false
      },
      {
        id: "adv-2",
        title: "Bulk Operations",
        type: "interactive",
        duration: "45 mins",
        completed: false,
        steps: [
          {
            id: "bulk-1",
            title: "Bulk Updates",
            completed: false,
            content: "Learn how to manage multiple tickets efficiently"
          },
          {
            id: "bulk-2",
            title: "Batch Processing",
            completed: false,
            content: "Advanced batch operations and automation"
          }
        ]
      }
    ]
  }
];

// Initialize mock data
export function initializeMockData() {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(mockTickets));
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(mockComments));
  localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(mockArticles));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mockCategories));
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(mockFeedback));
  localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(mockTimeEntries));
  localStorage.setItem(STORAGE_KEYS.LEARNING_PROGRESS, JSON.stringify(mockLearningProgress));
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(mockCourses));
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(mockProjects));
}

// Clear mock data
export function clearMockData() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

// Export mock data for direct access if needed
export const mockData = {
  users: mockUsers,
  admins: mockAdmins,
  employees: mockEmployees,
  clients: mockClients,
  tickets: mockTickets,
  comments: mockComments,
  articles: mockArticles,
  categories: mockCategories,
  feedback: mockFeedback,
  timeEntries: mockTimeEntries
}; 