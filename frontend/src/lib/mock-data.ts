import type { Employee, Ticket, TicketStats, TicketAttachment, Profile } from '@/types';

export const mockEmployee: Employee = {
  id: 'emp-1',
  email: 'john@company.com',
  name: 'John Smith',
  role: 'employee',
  createdAt: '2024-01-01T00:00:00Z',
  lastLogin: '2024-01-21T08:30:00Z',
  department: 'Technical Support',
  specialties: ['JavaScript', 'React', 'Node.js'],
  activeTickets: 3,
  performance: {
    resolvedTickets: 45,
    avgResponseTime: '2h 15m',
    customerRating: 4.8
  }
};

export const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Cannot access dashboard',
    description: 'Getting 403 error when trying to access the main dashboard',
    status: 'new',
    priority: 'high',
    createdBy: 'client-1',
    assignedTo: 'John Smith',
    client: 'client-1',
    createdAt: '2024-01-21T08:00:00Z',
    updatedAt: '2024-01-21T08:00:00Z',
    category: { main: 'technical', sub: 'access' },
    tags: ['dashboard', 'access', 'error'],
    attachments: [] as TicketAttachment[],
    interactions: []
  },
  {
    id: 'ticket-2',
    title: 'Integration failing',
    description: 'Salesforce integration stopped syncing data',
    status: 'in_progress',
    priority: 'critical',
    createdBy: 'client-1',
    assignedTo: 'John Smith',
    client: 'client-1',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:30:00Z',
    category: { main: 'technical', sub: 'integration' },
    tags: ['salesforce', 'sync', 'integration'],
    attachments: [] as TicketAttachment[],
    interactions: []
  }
];

export const mockTicketStats: TicketStats = {
  avgResponseTime: '15m',
  resolvedCount: 125,
  openCount: 45,
  satisfactionScore: 4.5,
  totalTickets: 170,
  criticalTickets: 3,
  slaBreaches: 1,
  resolutionRate: 0.85,
  feedbackScore: 4.2,
  activeTickets: 45,
  resolvedTickets: 125,
  resolvedToday: 8
};

export const mockPersonalStats = {
  ticketsResolved: 45,
  avgResponseTime: '1h 30m',
  customerSatisfaction: 4.8,
  slaCompliance: 95,
  dailyStats: [
    {
      date: '2024-01-15',
      resolved: 8,
      responses: 15,
      satisfaction: 4.7
    },
    {
      date: '2024-01-16',
      resolved: 10,
      responses: 18,
      satisfaction: 4.8
    },
    {
      date: '2024-01-17',
      resolved: 7,
      responses: 12,
      satisfaction: 4.9
    },
    {
      date: '2024-01-18',
      resolved: 12,
      responses: 20,
      satisfaction: 4.8
    },
    {
      date: '2024-01-19',
      resolved: 9,
      responses: 16,
      satisfaction: 4.7
    },
    {
      date: '2024-01-20',
      resolved: 11,
      responses: 19,
      satisfaction: 4.8
    },
    {
      date: '2024-01-21',
      resolved: 8,
      responses: 14,
      satisfaction: 4.9
    }
  ]
};

export const mockPerformanceGoals = [
  {
    id: 'goal-1',
    metric: 'Tickets Resolved',
    target: 50,
    progress: 45,
    unit: '',
    trend: {
      value: 15,
      direction: 'up' as const
    },
    timeframe: 'weekly' as const,
    startDate: '2024-01-15',
    endDate: '2024-01-21'
  },
  {
    id: 'goal-2',
    metric: 'Response Time',
    target: 60,
    progress: 45,
    unit: 'min',
    trend: {
      value: 10,
      direction: 'down' as const
    },
    timeframe: 'daily' as const,
    startDate: '2024-01-21'
  },
  {
    id: 'goal-3',
    metric: 'Customer Satisfaction',
    target: 4.8,
    progress: 4.5,
    unit: '',
    trend: {
      value: 5,
      direction: 'up' as const
    },
    timeframe: 'monthly' as const,
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  },
  {
    id: 'goal-4',
    metric: 'SLA Compliance',
    target: 98,
    progress: 95,
    unit: '%',
    trend: {
      value: 2,
      direction: 'up' as const
    },
    timeframe: 'weekly' as const,
    startDate: '2024-01-15',
    endDate: '2024-01-21'
  }
];

export const mockTicketEvents = [
  {
    id: 'event-1',
    ticketId: 'ticket-1',
    type: 'status_change',
    from: 'new',
    to: 'in_progress',
    timestamp: '2024-01-21T09:00:00Z',
    actor: 'emp-1'
  },
  {
    id: 'event-2',
    ticketId: 'ticket-2',
    type: 'comment',
    content: 'Started investigating the integration issue',
    timestamp: '2024-01-20T09:35:00Z',
    actor: 'emp-1'
  }
];

export const mockResponseTemplates = [
  {
    id: 'template-1',
    name: 'Account Access Resolution',
    category: 'Access Issues',
    tags: ['login', 'access', 'password'],
    versions: [
      {
        id: 'v1',
        content: 'I understand you\'re having trouble accessing your account. I\'ll help you resolve this right away. Could you please verify if you\'re using the correct email address for login?',
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'emp-1'
      },
      {
        id: 'v2',
        content: 'I understand you\'re having trouble accessing your account. I\'ll help you resolve this right away.\n\n1. First, please verify your email address\n2. Try resetting your password using the "Forgot Password" link\n3. Clear your browser cache and cookies\n\nLet me know if you need help with any of these steps.',
        createdAt: '2024-01-18T14:30:00Z',
        createdBy: 'emp-1'
      }
    ],
    currentVersion: 'v2'
  },
  {
    id: 'template-2',
    name: 'Integration Troubleshooting',
    category: 'Technical Support',
    tags: ['integration', 'sync', 'api'],
    versions: [
      {
        id: 'v1',
        content: 'I see you\'re experiencing issues with the integration. Let\'s troubleshoot this together. Could you please provide the following information:\n\n1. Last successful sync timestamp\n2. Any error messages you\'re seeing\n3. Recent changes to your configuration',
        createdAt: '2024-01-16T11:20:00Z',
        createdBy: 'emp-1'
      }
    ],
    currentVersion: 'v1'
  }
];

export const mockSharedTemplates = [
  {
    ...mockResponseTemplates[0],
    sharedBy: 'emp-1',
    sharedWith: ['emp-2', 'emp-3'],
    approvalStatus: 'approved',
    approvalComment: 'Great template, very clear instructions',
    reviewedBy: 'emp-4',
    reviewedAt: '2024-01-19T15:00:00Z',
    effectiveness: {
      usageCount: 25,
      successRate: 0.92,
      avgResponseTime: 180,
      avgSatisfactionScore: 4.8,
      lastUsed: '2024-01-21T16:45:00Z'
    }
  },
  {
    ...mockResponseTemplates[1],
    sharedBy: 'emp-2',
    sharedWith: ['emp-1', 'emp-3'],
    approvalStatus: 'pending',
    effectiveness: {
      usageCount: 12,
      successRate: 0.85,
      avgResponseTime: 240,
      avgSatisfactionScore: 4.5,
      lastUsed: '2024-01-21T14:20:00Z'
    }
  },
  {
    id: 'template-3',
    name: 'Feature Request Response',
    category: 'Customer Feedback',
    tags: ['feature', 'request', 'feedback'],
    versions: [
      {
        id: 'v1',
        content: 'Thank you for your feature suggestion! We appreciate your input in making our product better. I\'ve documented your request and will forward it to our product team for review.',
        createdAt: '2024-01-20T09:15:00Z',
        createdBy: 'emp-3'
      }
    ],
    currentVersion: 'v1',
    sharedBy: 'emp-3',
    sharedWith: ['emp-1', 'emp-2'],
    approvalStatus: 'rejected',
    approvalComment: 'Needs more specific details about the feedback process',
    reviewedBy: 'emp-4',
    reviewedAt: '2024-01-21T10:30:00Z',
    effectiveness: {
      usageCount: 5,
      successRate: 0.60,
      avgResponseTime: 300,
      avgSatisfactionScore: 3.9,
      lastUsed: '2024-01-21T11:15:00Z'
    }
  }
];

export const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    department: 'IT Support',
    title: 'Senior Support Manager',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    lastActive: '2024-03-20T10:30:00Z',
    joinedDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    department: 'Customer Support',
    title: 'Support Specialist',
    phone: '+1 (555) 987-6543',
    timezone: 'America/Chicago',
    lastActive: '2024-03-20T09:45:00Z',
    joinedDate: '2023-03-01'
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@client.com',
    role: 'client',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    joinedDate: '2023-06-20'
  }
]; 