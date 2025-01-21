import { templateManager, ResponseTemplate, TemplateUsageStats } from './template-manager';
import { wsService } from './websocket';
import type { Ticket, TicketCategory, TicketPriority, TicketMainCategory } from '@/types';

interface TemplateRecommendation {
  template: ResponseTemplate;
  score: number;
  reason: string;
}

interface TemplateContext {
  ticketCategory?: TicketCategory;
  ticketPriority?: TicketPriority;
  customerHistory?: {
    previousTickets: number;
    satisfactionScore?: number;
  };
  timeOfDay?: string;
  agentExpertise?: string[];
}

class AITemplateService {
  private async analyzeTicketContext(ticket: Ticket): Promise<TemplateContext> {
    // In a real implementation, this would use more sophisticated analysis
    return {
      ticketCategory: ticket.category,
      ticketPriority: ticket.priority,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                 new Date().getHours() < 17 ? 'afternoon' : 'evening',
    };
  }

  private async calculateTemplateScore(template: ResponseTemplate, context: TemplateContext, ticket: Ticket): Promise<number> {
    let score = 0;

    // Category match - check main category
    if (context.ticketCategory && 
        template.category === context.ticketCategory.main) {
      score += 0.4;
    }

    // Tag relevance
    const ticketWords = new Set([
      ...ticket.title.toLowerCase().split(' '),
      ...ticket.description.toLowerCase().split(' ')
    ]);
    const relevantTags = template.tags.filter(tag => 
      ticketWords.has(tag.toLowerCase())
    );
    score += (relevantTags.length / template.tags.length) * 0.3;

    // Usage success
    const usageStats = await templateManager.getUsageStats();
    const stats = usageStats[template.id];
    if (stats && stats.usageCount > 0) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  private async generateRecommendationReason(score: number, template: ResponseTemplate, context: TemplateContext): Promise<string> {
    const reasons = [];
    const usageStats = await templateManager.getUsageStats();
    const stats = usageStats[template.id];

    if (context.ticketCategory && 
        template.category === context.ticketCategory.main) {
      reasons.push('matches ticket category');
    }
    if (stats && stats.usageCount > 10) {
      reasons.push('frequently used with success');
    }
    if (context.ticketPriority && template.tags.includes(context.ticketPriority)) {
      reasons.push('appropriate for ticket priority');
    }

    return reasons.length > 0 
      ? `This template ${reasons.join(', ')} (${Math.round(score * 100)}% match)`
      : `Potential match based on content (${Math.round(score * 100)}% match)`;
  }

  async getRecommendedTemplates(ticket: Ticket): Promise<TemplateRecommendation[]> {
    try {
      const context = await this.analyzeTicketContext(ticket);
      const templates = await templateManager.getTemplates();
      
      const recommendations: TemplateRecommendation[] = await Promise.all(
        templates.map(async template => {
          const score = await this.calculateTemplateScore(template, context, ticket);
          return {
            template,
            score,
            reason: await this.generateRecommendationReason(score, template, context)
          };
        })
      );

      const filteredRecommendations = recommendations
        .filter(rec => rec.score > 0.3) // Only include reasonably good matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Get top 5 recommendations

      // Notify about recommendations via WebSocket
      wsService.send({
        type: 'TEMPLATE_UPDATE',
        payload: {
          action: 'recommendations',
          ticketId: ticket.id,
          recommendations: filteredRecommendations
        }
      });

      return filteredRecommendations;
    } catch (error) {
      console.error('Error getting template recommendations:', error);
      return [];
    }
  }

  async improveTemplateRecommendations(
    ticketId: string,
    templateId: string,
    wasSuccessful: boolean,
    customerFeedback?: number
  ): Promise<void> {
    // Record usage statistics
    await templateManager.recordUsage(templateId, {
      responseTime: 0,
      wasSuccessful,
      satisfactionScore: customerFeedback
    });
  }
}

export const aiTemplateService = new AITemplateService(); 