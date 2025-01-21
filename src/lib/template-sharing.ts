import { templateManager, ResponseTemplate } from './template-manager';
import { wsService } from './websocket';
import { mockSharedTemplates } from './mock-data';
import type { Employee } from '@/types';

export type TemplateApprovalStatus = 'pending' | 'approved' | 'rejected';

interface SharedTemplate extends ResponseTemplate {
  sharedBy: string;
  sharedWith: string[];
  approvalStatus: TemplateApprovalStatus;
  approvalComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  teamId?: string;
  effectiveness?: {
    usageCount: number;
    successRate: number;
    avgResponseTime: number;
    avgSatisfactionScore: number;
    lastUsed: string;
  };
}

interface TemplateReview {
  templateId: string;
  reviewerId: string;
  status: TemplateApprovalStatus;
  comment?: string;
  timestamp: string;
}

class TemplateSharingService {
  private storageKey = 'shared_templates';
  private reviewsKey = 'template_reviews';
  private initialized = false;

  private initialize() {
    if (this.initialized || typeof window === 'undefined') return;
    
    // Initialize storage with mock data if empty
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(mockSharedTemplates));
    }
    if (!localStorage.getItem(this.reviewsKey)) {
      localStorage.setItem(this.reviewsKey, JSON.stringify([]));
    }
    this.initialized = true;
  }

  // Template Sharing
  async shareTemplate(
    templateId: string,
    sharedBy: string,
    sharedWith: string[],
    teamId?: string
  ): Promise<SharedTemplate> {
    if (typeof window === 'undefined') return {
      id: '',
      name: '',
      category: '',
      tags: [],
      versions: [],
      currentVersion: '',
      sharedBy,
      sharedWith,
      teamId,
      approvalStatus: 'pending',
      effectiveness: {
        usageCount: 0,
        successRate: 0,
        avgResponseTime: 0,
        avgSatisfactionScore: 0,
        lastUsed: new Date().toISOString()
      }
    } as SharedTemplate;
    this.initialize();
    const template = await templateManager.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const sharedTemplate: SharedTemplate = {
      ...template,
      sharedBy,
      sharedWith,
      teamId,
      approvalStatus: 'pending',
      effectiveness: {
        usageCount: 0,
        successRate: 0,
        avgResponseTime: 0,
        avgSatisfactionScore: 0,
        lastUsed: new Date().toISOString()
      }
    };

    const sharedTemplates = await this.getSharedTemplates();
    sharedTemplates.push(sharedTemplate);
    this.saveSharedTemplates(sharedTemplates);

    wsService.send({
      type: 'TEMPLATE_UPDATE',
      payload: {
        action: 'shared',
        template: sharedTemplate
      }
    });

    return sharedTemplate;
  }

  async getSharedTemplates(): Promise<SharedTemplate[]> {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  async getSharedTemplatesForUser(userId: string): Promise<SharedTemplate[]> {
    if (typeof window === 'undefined') return [];
    const templates = await this.getSharedTemplates();
    return templates.filter(t => 
      t.sharedWith.includes(userId) || t.sharedBy === userId
    );
  }

  // Template Approval Workflow
  async submitForApproval(templateId: string, reviewerId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    this.initialize();
    const templates = await this.getSharedTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    template.approvalStatus = 'pending';
    this.saveSharedTemplates(templates);

    wsService.send({
      type: 'TEMPLATE_UPDATE',
      payload: {
        action: 'approval_requested',
        templateId,
        reviewerId
      }
    });
  }

  async reviewTemplate(
    templateId: string,
    reviewerId: string,
    status: TemplateApprovalStatus,
    comment?: string
  ): Promise<void> {
    if (typeof window === 'undefined') return;
    this.initialize();
    const templates = await this.getSharedTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    template.approvalStatus = status;
    template.approvalComment = comment;
    template.reviewedBy = reviewerId;
    template.reviewedAt = new Date().toISOString();

    this.saveSharedTemplates(templates);

    const review: TemplateReview = {
      templateId,
      reviewerId,
      status,
      comment,
      timestamp: new Date().toISOString()
    };

    await this.saveReview(review);

    wsService.send({
      type: 'TEMPLATE_UPDATE',
      payload: {
        action: 'review_completed',
        templateId,
        status,
        reviewerId
      }
    });
  }

  // Template Effectiveness Tracking
  async updateEffectiveness(
    templateId: string,
    data: {
      responseTime: number;
      wasSuccessful: boolean;
      satisfactionScore?: number;
    }
  ): Promise<void> {
    if (typeof window === 'undefined') return;
    this.initialize();
    const templates = await this.getSharedTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template || !template.effectiveness) return;

    const eff = template.effectiveness;
    eff.usageCount++;
    eff.lastUsed = new Date().toISOString();

    // Update success rate
    const totalSuccesses = eff.successRate * (eff.usageCount - 1) + (data.wasSuccessful ? 1 : 0);
    eff.successRate = totalSuccesses / eff.usageCount;

    // Update response time
    eff.avgResponseTime = (
      (eff.avgResponseTime * (eff.usageCount - 1) + data.responseTime) / 
      eff.usageCount
    );

    // Update satisfaction score
    if (data.satisfactionScore) {
      eff.avgSatisfactionScore = (
        (eff.avgSatisfactionScore * (eff.usageCount - 1) + data.satisfactionScore) /
        eff.usageCount
      );
    }

    this.saveSharedTemplates(templates);

    wsService.send({
      type: 'TEMPLATE_UPDATE',
      payload: {
        action: 'effectiveness_updated',
        templateId,
        effectiveness: template.effectiveness
      }
    });
  }

  async getTemplateEffectiveness(templateId: string): Promise<SharedTemplate['effectiveness'] | null> {
    if (typeof window === 'undefined') return null;
    this.initialize();
    const templates = await this.getSharedTemplates();
    const template = templates.find(t => t.id === templateId);
    return template?.effectiveness || null;
  }

  // Private helper methods
  private saveSharedTemplates(templates: SharedTemplate[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
  }

  private async getReviews(): Promise<TemplateReview[]> {
    if (typeof window === 'undefined') return [];
    this.initialize();
    const stored = localStorage.getItem(this.reviewsKey);
    return stored ? JSON.parse(stored) : [];
  }

  private async saveReview(review: TemplateReview): Promise<void> {
    if (typeof window === 'undefined') return;
    this.initialize();
    const reviews = await this.getReviews();
    reviews.push(review);
    localStorage.setItem(this.reviewsKey, JSON.stringify(reviews));
  }
}

export const templateSharing = new TemplateSharingService(); 