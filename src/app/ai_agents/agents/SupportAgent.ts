import { BaseAgent } from '../core/BaseAgent';
import type { Database } from '@/app/types/database';
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

    // Start a new session by creating a session activity
    const { data: session, error: sessionError } = await this.client
      .from('zen_ticket_activities')
      .insert({
        ticket_id: params.ticketId,
        activity_type: 'ai_session',
        content: 'AI Support Session',
        created_by: this.agentId,
        metadata: {
          session_type: 'support',
          context: conversationContext
        }
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Store the response message
    const { data: messageData, error: messageError } = await this.client
      .from('zen_ticket_messages')
      .insert({
        ticket_id: params.ticketId,
        content: response,
        created_by: this.agentId,
        source: 'ai',
        metadata: {
          session_id: session.id,
          relevant_articles: relevantArticles
        }
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Generate and store session summary
    const summary = await this.nlpService.generateResponse(
      `Summarize this support session:\n\nUser Query: ${params.userQuery}\nContext: ${conversationContext}\nAI Response: ${response}`,
      'Generate a concise summary of this support interaction'
    );

    const { error: summaryError } = await this.client
      .from('zen_ticket_summaries')
      .insert({
        ticket_id: params.ticketId,
        summary,
        created_by: this.agentId,
        created_by_role: 'admin',
        ai_session_data: {
          session_type: 'support',
          user_query: params.userQuery,
          context: conversationContext,
          generated_response: response,
          relevant_articles: relevantArticles
        }
      });

    if (summaryError) throw summaryError;

    await this.logAction('GENERATE_RESPONSE', {
      ticketId: params.ticketId,
      messageId: messageData.id,
      sessionId: session.id
    });

    return {
      response,
      messageId: messageData.id,
      sessionId: session.id
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
        source: 'ai'
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
