import { BaseAgent } from '../core/BaseAgent';
import { Database } from '../types/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { NLPService } from '../services/NLPService';
import { ResearchService } from '../services/ResearchService';

interface MessageAnalysisParams {
  content: string;
  ticketId: string;
}

interface ResponseGenerationParams {
  ticketId: string;
  previousMessages: Array<{
    content: string;
    role: 'user' | 'agent';
    timestamp: string;
  }>;
  userQuery: string;
}

interface EscalationParams {
  ticketId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export class SupportAgent extends BaseAgent {
  private nlpService: NLPService;
  private researchService: ResearchService;

  constructor(supabaseClient: SupabaseClient<Database>, agentId: string) {
    super(supabaseClient, agentId);
    this.nlpService = new NLPService();
    this.researchService = new ResearchService();
  }

  async execute(
    action: 'analyze' | 'respond' | 'escalate',
    params: MessageAnalysisParams | ResponseGenerationParams | EscalationParams
  ): Promise<any> {
    await this.validateAccess();

    switch (action) {
      case 'analyze':
        return this.analyzeMessage(params as MessageAnalysisParams);
      case 'respond':
        return this.generateResponse(params as ResponseGenerationParams);
      case 'escalate':
        return this.escalateTicket(params as EscalationParams);
      default:
        throw new Error('Invalid action specified');
    }
  }

  private async analyzeMessage(params: MessageAnalysisParams): Promise<any> {
    // Use NLPService for advanced analysis
    const [sentiment, intent, keywords] = await Promise.all([
      this.nlpService.analyzeSentiment(params.content),
      this.nlpService.classifyIntent(params.content),
      this.nlpService.extractKeywords(params.content)
    ]);

    // Get relevant documentation based on keywords
    const relevantDocs = await this.researchService.findRelevantDocumentation(
      params.content,
      keywords.join(' ')
    );

    const analysis = {
      sentiment,
      intent,
      keywords,
      urgency: this.determineUrgency(params.content, sentiment),
      suggestedDocumentation: await this.researchService.summarizeFindings(relevantDocs)
    };

    await this.logAction('ANALYZE_MESSAGE', {
      ticketId: params.ticketId,
      analysis
    });

    return analysis;
  }

  private async generateResponse(params: ResponseGenerationParams): Promise<any> {
    // Get relevant knowledge base articles
    const { data: relevantArticles } = await this.client
      .from('zen_knowledge_articles')
      .select('*')
      .textSearch('content', params.userQuery)
      .limit(3);

    // Convert conversation history to context
    const conversationContext = params.previousMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Generate response using NLPService
    const response = await this.nlpService.generateResponse(
      `Context:\n${conversationContext}\n\nRelevant Knowledge:\n${
        relevantArticles?.map(article => article.content).join('\n') || ''
      }`,
      params.userQuery
    );

    // Store the response
    const { data: messageData, error } = await this.client
      .from('zen_ticket_messages')
      .insert({
        ticket_id: params.ticketId,
        content: response,
        created_by: this.agentId,
        type: 'ai_response'
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAction('GENERATE_RESPONSE', {
      ticketId: params.ticketId,
      messageId: messageData.id
    });

    return {
      response,
      messageId: messageData.id
    };
  }

  private async escalateTicket(params: EscalationParams): Promise<any> {
    // Update ticket status and priority
    const { data: ticket, error } = await this.client
      .from('zen_tickets')
      .update({
        status: 'escalated',
        priority: params.priority
      })
      .eq('id', params.ticketId)
      .select()
      .single();

    if (error) throw error;

    // Add escalation note
    await this.client
      .from('zen_ticket_messages')
      .insert({
        ticket_id: params.ticketId,
        content: `Ticket escalated: ${params.reason}`,
        created_by: this.agentId,
        type: 'escalation_note'
      });

    await this.logAction('ESCALATE_TICKET', {
      ticketId: params.ticketId,
      reason: params.reason,
      priority: params.priority
    });

    return ticket;
  }

  private determineUrgency(content: string, sentiment: string): 'low' | 'medium' | 'high' {
    // Use sentiment to help determine urgency
    const urgentWords = ['urgent', 'asap', 'emergency', 'critical'];
    const contentLower = content.toLowerCase();
    
    if (urgentWords.some(word => contentLower.includes(word))) return 'high';
    if (sentiment === 'negative' && content.includes('!')) return 'high';
    if (sentiment === 'negative') return 'medium';
    return 'low';
  }
}
