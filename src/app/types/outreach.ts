export type MessageType = 'initial' | 'followup' | 'proposal' | 'check_in' | 'milestone' | 'urgent';

export type MessageTone = 'formal' | 'casual' | 'friendly' | 'urgent';

export interface SequenceStep {
  id: string;
  messageType: MessageType;
  delayDays: number;
  tone: MessageTone;
  template: string;
  conditions?: {
    requiresPreviousResponse?: boolean;
    minimumEngagementScore?: number;
  };
}

export interface OutreachSequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  targetAudience?: string;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SequenceExecution {
  id: string;
  sequenceId: string;
  ticketId: string;
  currentStep: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startedAt: string;
  nextMessageDue: string;
  completedSteps: {
    stepId: string;
    completedAt: string;
    response?: {
      received: boolean;
      receivedAt?: string;
      sentiment?: string;
    };
  }[];
}

export interface BatchSequenceParams {
  projectId: string;
  sequenceId: string;
  filters?: {
    status?: string;
    category?: string;
    priority?: string;
    lastContactDays?: number;
    tags?: string[];
  };
  customization?: {
    variables?: Record<string, string>;
    overrides?: {
      tone?: MessageTone;
      delayDays?: number;
    };
  };
} 