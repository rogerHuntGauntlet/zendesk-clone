import { randomUUID } from 'crypto';

export interface MockInteraction {
  messageId: string;
  prospectId: string;
  timestamp: Date;
  type: 'email_open' | 'link_click' | 'reply' | 'meeting_scheduled';
  metadata: {
    timeToInteract?: number;  // Time in minutes from send to interaction
    sentiment?: 'positive' | 'neutral' | 'negative';
    replyContent?: string;
  };
}

export interface ProspectProfile {
  id: string;
  responsePattern: 'quick' | 'delayed' | 'sporadic' | 'non_responsive';
  preferredTime: { hour: number; day: 'weekday' | 'weekend' };
  interestLevel: 'high' | 'medium' | 'low';
  commonActions: Array<'email_open' | 'link_click' | 'reply' | 'meeting_scheduled'>;
}

export class MockProspectSimulator {
  private prospects: Map<string, ProspectProfile> = new Map();
  private interactions: MockInteraction[] = [];

  constructor() {
    // Initialize with some default prospect profiles
    this.createDefaultProfiles();
  }

  private createDefaultProfiles() {
    const profiles: ProspectProfile[] = [
      {
        id: randomUUID(),
        responsePattern: 'quick',
        preferredTime: { hour: 9, day: 'weekday' },
        interestLevel: 'high',
        commonActions: ['email_open', 'link_click', 'reply', 'meeting_scheduled']
      },
      {
        id: randomUUID(),
        responsePattern: 'delayed',
        preferredTime: { hour: 15, day: 'weekday' },
        interestLevel: 'medium',
        commonActions: ['email_open', 'link_click']
      },
      {
        id: randomUUID(),
        responsePattern: 'sporadic',
        preferredTime: { hour: 20, day: 'weekend' },
        interestLevel: 'low',
        commonActions: ['email_open']
      }
    ];

    profiles.forEach(profile => this.prospects.set(profile.id, profile));
  }

  simulateInteraction(messageId: string, prospectId: string, sendTime: Date): MockInteraction[] {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) throw new Error('Prospect not found');

    const interactions: MockInteraction[] = [];
    const baseDelay = this.getBaseDelay(prospect.responsePattern);
    
    // Simulate email open
    if (Math.random() > 0.1) { // 90% chance of opening
      interactions.push(this.createInteraction(messageId, prospectId, sendTime, 'email_open', baseDelay));
    }

    // Simulate other actions based on interest level and common actions
    if (prospect.interestLevel === 'high') {
      if (prospect.commonActions.includes('reply')) {
        interactions.push(this.createInteraction(messageId, prospectId, sendTime, 'reply', baseDelay * 2));
      }
      if (prospect.commonActions.includes('meeting_scheduled')) {
        interactions.push(this.createInteraction(messageId, prospectId, sendTime, 'meeting_scheduled', baseDelay * 3));
      }
    } else if (prospect.interestLevel === 'medium' && Math.random() > 0.5) {
      if (prospect.commonActions.includes('link_click')) {
        interactions.push(this.createInteraction(messageId, prospectId, sendTime, 'link_click', baseDelay * 1.5));
      }
    }

    this.interactions.push(...interactions);
    return interactions;
  }

  private createInteraction(
    messageId: string, 
    prospectId: string, 
    sendTime: Date, 
    type: MockInteraction['type'],
    delayMinutes: number
  ): MockInteraction {
    const timestamp = new Date(sendTime.getTime() + delayMinutes * 60000);
    return {
      messageId,
      prospectId,
      timestamp,
      type,
      metadata: {
        timeToInteract: delayMinutes,
        sentiment: this.generateSentiment(),
        replyContent: type === 'reply' ? this.generateReplyContent() : undefined
      }
    };
  }

  private getBaseDelay(pattern: ProspectProfile['responsePattern']): number {
    switch (pattern) {
      case 'quick': return Math.random() * 60; // 0-1 hour
      case 'delayed': return 60 + Math.random() * 1440; // 1-24 hours
      case 'sporadic': return 1440 + Math.random() * 4320; // 1-3 days
      case 'non_responsive': return Infinity;
      default: return 240; // 4 hours default
    }
  }

  private generateSentiment(): 'positive' | 'neutral' | 'negative' {
    const rand = Math.random();
    if (rand > 0.7) return 'positive';
    if (rand > 0.3) return 'neutral';
    return 'negative';
  }

  private generateReplyContent(): string {
    const replies = [
      "Thanks for reaching out. I'd be interested in learning more.",
      "Could you provide more information about your services?",
      "This sounds interesting. Let's schedule a call.",
      "Not interested at the moment, but maybe in the future."
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  getInteractionHistory(prospectId: string): MockInteraction[] {
    return this.interactions.filter(i => i.prospectId === prospectId);
  }

  getOptimalSendTime(prospectId: string): Date {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) throw new Error('Prospect not found');

    const now = new Date();
    const optimalTime = new Date(now);
    optimalTime.setHours(prospect.preferredTime.hour, 0, 0, 0);

    if (prospect.preferredTime.day === 'weekend') {
      // Adjust to next weekend if needed
      while (optimalTime.getDay() !== 0 && optimalTime.getDay() !== 6) {
        optimalTime.setDate(optimalTime.getDate() + 1);
      }
    } else {
      // Adjust to next weekday if needed
      while (optimalTime.getDay() === 0 || optimalTime.getDay() === 6) {
        optimalTime.setDate(optimalTime.getDate() + 1);
      }
    }

    return optimalTime;
  }
} 