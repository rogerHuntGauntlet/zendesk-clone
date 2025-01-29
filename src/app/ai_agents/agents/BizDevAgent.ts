import { BaseAgent } from '../core/BaseAgent';
import { Database } from '../../types/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { ResearchService } from '../services/ResearchService';
import { NLPService } from '../services/NLPService';

interface ProspectInfo {
  name: string;
  email: string;
  company: string;
  projectId: string;
  notes?: string;
}

interface ResearchParams {
  projectId: string;
  ticketId?: string;  // Optional, if researching a specific prospect
  prospect_data: ProspectInfo;
}

interface OutreachParams {
  ticketId: string;
  messageType: 'initial' | 'followup' | 'proposal' | 'check_in' | 'milestone' | 'urgent';
  context?: {
    tone?: 'formal' | 'casual' | 'friendly' | 'urgent';
    previousInteractions?: any[];
    customFields?: Record<string, any>;
  };
  trackingEnabled?: boolean;
}

interface BatchOutreachParams {
  projectId: string;
  messageType: 'initial' | 'followup' | 'proposal' | 'check_in' | 'milestone' | 'urgent';
  filters?: {
    status?: string;
    category?: string;
    priority?: string;
    lastContactDays?: number;
  };
  context?: {
    tone?: 'formal' | 'casual' | 'friendly' | 'urgent';
    customFields?: Record<string, any>;
  };
  trackingEnabled?: boolean;
}

interface TicketMessage {
  content: string;
  type: string;
  metadata?: {
    effectiveness_score?: number;
  };
  created_at: string;
}

interface TicketActivity {
  activity_type: string;
  content: string;
  created_at: string;
}

interface TicketSummary {
  summary: string;
  ai_session_data: any;
  created_at: string;
}

interface BatchGenerationResult {
  successful: Array<{
    ticketId: string;
    message: string;
    metadata: any;
  }>;
  failed: Array<{
    ticketId: string;
    error: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    averageGenerationTime: number;
  };
}

export class BizDevAgent extends BaseAgent {
  private researchService: ResearchService;
  private nlpService: NLPService;

  constructor(supabaseClient: SupabaseClient<Database>, agentId: string) {
    super(supabaseClient, agentId);
    this.researchService = new ResearchService();
    this.nlpService = new NLPService();
  }

  async execute(
    action: 'research_prospects' | 'generate_outreach' | 'batch_generate_outreach',
    params: ResearchParams | OutreachParams | BatchOutreachParams
  ): Promise<any> {
    await this.validateAccess();

    switch (action) {
      case 'research_prospects':
        return this.researchProspects(params as ResearchParams);
      case 'generate_outreach':
        return this.generateOutreach(params as OutreachParams);
      case 'batch_generate_outreach':
        return this.batchGenerateOutreach(params as BatchOutreachParams);
      default:
        throw new Error('Invalid action specified');
    }
  }

  private async researchProspects(params: ResearchParams): Promise<any[]> {
    // If ticketId is provided, research just that one prospect
    if (params.ticketId) {
      const result = await this.researchSingleProspect(params.ticketId, params);
      return [result];
    }

    // Get all prospect tickets in the project that need research
    const { data: tickets } = await this.client
      .from('zen_tickets')
      .select('*')
      .eq('project_id', params.projectId)
      .eq('category', 'prospect')
      .eq('status', 'new')  // Only research new prospects
      .order('created_at', { ascending: true });

    const results: any[] = [];

    if (!tickets) {
      return results;
    }

    for (const ticket of tickets) {
      const result = await this.researchSingleProspect(ticket.id, params);
      results.push(result);
    }

    return results;
  }

  private async researchSingleProspect(ticketId: string, params: ResearchParams): Promise<any> {
    // Get the ticket
    const { data: ticket } = await this.client
      .from('zen_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    const prospectData = params.prospect_data;
    
    // Get the agent's email
    const { data: agent } = await this.client
      .from('zen_agents')
      .select('email, name')
      .eq('id', this.agentId)
      .single();

    if (!agent?.email) {
      throw new Error('Agent email not found');
    }

    // Get or create the zen_user associated with this agent's email
    let { data: zenUser } = await this.client
      .from('zen_users')
      .select('id')
      .eq('email', agent.email)
      .single();

    if (!zenUser) {
      // Create a new zen_user for this agent
      const { data: newUser, error: createError } = await this.client
        .from('zen_users')
        .insert({
          email: agent.email,
          name: agent.name || 'BizDev Agent',
          role: 'admin'  // Using admin role for AI agents
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create zen_user for agent: ${createError.message}`);
      }
      zenUser = newUser;
    }

    if (!zenUser?.id) {
      throw new Error('Failed to get or create zen_user for agent');
    }

    // Start a new research session
    const { data: session, error: sessionError } = await this.client
      .from('zen_ticket_activities')
      .insert({
        ticket_id: ticketId,
        activity_type: 'ai_research_session',
        content: 'AI Research Session',
        created_by: zenUser.id,
        metadata: {
          session_type: 'research',
          prospect_data: prospectData
        }
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Use ResearchService to gather information
    const [companyData, personData] = await Promise.all([
      this.researchService.analyzeCompany(prospectData.company),
      this.researchService.analyzePerson(prospectData.name, prospectData.email, prospectData.company)
    ]);

    // Calculate qualification score
    const qualificationScore = await this.calculateQualificationScore(companyData, personData);

    // Create a research activity record
    const { data: researchActivity, error: activityError } = await this.client
      .from('zen_ticket_activities')
      .insert({
        ticket_id: ticketId,
        activity_type: 'research',
        content: 'AI Research Update',
        metadata: {
          research_data: {
            company: companyData,
            person: personData,
            qualification_score: qualificationScore,
            researched_at: new Date().toISOString()
          },
          session_id: session.id
        },
        created_by: zenUser.id
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // Update the ticket with essential data and research findings
    const { data: updatedTicket, error: ticketError } = await this.client
      .from('zen_tickets')
      .update({
        priority: this.determineInitialPriority(qualificationScore),
        status: 'in_progress',
        updated_at: new Date().toISOString(),
        description: this.formatResearchSummary(companyData, personData) // Add research as ticket description
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Generate research summary
    const summary = this.formatResearchSummary(companyData, personData);

    // Add research summary as a ticket message
    const { data: message, error: messageError } = await this.client
      .from('zen_ticket_messages')
      .insert({
        ticket_id: ticketId,
        content: summary,
        created_by: zenUser.id,
        source: 'ai',
        metadata: {
          research_activity_id: researchActivity.id,
          session_id: session.id
        }
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Store session summary
    const { error: summaryError } = await this.client
      .from('zen_ticket_summaries')
      .insert({
        ticket_id: ticketId,
        summary: `Research conducted on ${prospectData.name} from ${prospectData.company}. Qualification score: ${qualificationScore}. Priority: ${this.determineInitialPriority(qualificationScore)}.`,
        created_by: zenUser.id,
        created_by_role: 'ai',
        ai_session_data: {
          research_data: {
            company: companyData,
            person: personData,
            qualification_score: qualificationScore,
            researched_at: new Date().toISOString()
          },
          session_type: 'research',
          prospect_data: prospectData
        }
      });

    if (summaryError) throw summaryError;

    await this.logAction('RESEARCH_PROSPECT', {
      ticketId,
      score: qualificationScore,
      activityId: researchActivity.id,
      sessionId: session.id
    });

    return {
      ticket: updatedTicket,
      research: researchActivity,
      message,
      session
    };
  }

  private async generateOutreach(params: OutreachParams): Promise<any> {
    try {
      // Get ticket data with full context
      const { data: ticket } = await this.client
        .from('zen_tickets')
        .select(`
          *,
          zen_ticket_activities (*),
          zen_ticket_messages (*),
          zen_projects (*),
          zen_ticket_summaries (*)
        `)
        .eq('id', params.ticketId)
        .single();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Analyze past interactions and engagement patterns
      const pastInteractions = (ticket.zen_ticket_messages || []) as TicketMessage[];
      const activities = (ticket.zen_ticket_activities || []) as TicketActivity[];
      const summaries = (ticket.zen_ticket_summaries || []) as TicketSummary[];

      // Generate rich context for the message
      const context = {
        ticket,
        prompt: params.context?.customFields?.prompt || '',
        pastInteractions: pastInteractions.map((msg: TicketMessage) => ({
          content: msg.content,
          type: msg.type,
          effectiveness: msg.metadata?.effectiveness_score,
          sentAt: msg.created_at
        })),
        activities: activities.map((act: TicketActivity) => ({
          type: act.activity_type,
          description: act.content,
          timestamp: act.created_at
        })),
        summaries: summaries.map((sum: TicketSummary) => ({
          summary: sum.summary,
          aiData: sum.ai_session_data,
          createdAt: sum.created_at
        }))
      };

      // Generate the message with enhanced context
      const message = await this.nlpService.generateResponse(
        JSON.stringify(context),
        `Generate a ${params.context?.tone || 'professional'} outreach message that considers the full interaction history and current context.`
      );

      // Analyze message characteristics
      const [sentiment, intent, keywords] = await Promise.all([
        this.nlpService.analyzeSentiment(message),
        this.nlpService.classifyIntent(message),
        this.nlpService.extractKeywords(message)
      ]);

      // Store message metadata for learning
      const messageMetadata = {
        sentiment,
        intent,
        keywords,
        generatedAt: new Date().toISOString(),
        contextSize: JSON.stringify(context).length,
        prompt: params.context?.customFields?.prompt
      };

      // Store the generation attempt for learning
      await this.client.from('zen_ticket_activities').insert({
        ticket_id: params.ticketId,
        activity_type: 'ai_message_generation',
        content: 'AI generated outreach message',
        metadata: messageMetadata
      });

      return { 
        message, 
        metadata: messageMetadata,
        context: {
          pastInteractionCount: pastInteractions.length,
          lastInteraction: pastInteractions[pastInteractions.length - 1]?.created_at,
          summaryCount: summaries.length
        }
      };
    } catch (error) {
      console.error('Error in generateOutreach:', error);
      throw error;
    }
  }

  private async batchGenerateOutreach(params: BatchOutreachParams): Promise<BatchGenerationResult> {
    const startTime = Date.now();
    const result: BatchGenerationResult = {
      successful: [],
      failed: [],
      summary: {
        total: 0,
        succeeded: 0,
        failed: 0,
        averageGenerationTime: 0
      }
    };

    try {
      // Build query for tickets
      let query = this.client
        .from('zen_tickets')
        .select('*')
        .eq('project_id', params.projectId);

      // Apply filters
      if (params.filters) {
        if (params.filters.status) {
          query = query.eq('status', params.filters.status);
        }
        if (params.filters.category) {
          query = query.eq('category', params.filters.category);
        }
        if (params.filters.priority) {
          query = query.eq('priority', params.filters.priority);
        }
        if (params.filters.lastContactDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - params.filters.lastContactDays);
          query = query.lt('last_contact_at', cutoffDate.toISOString());
        }
      }

      const { data: tickets, error } = await query;

      if (error) throw error;
      if (!tickets || tickets.length === 0) {
        return {
          ...result,
          summary: { ...result.summary, total: 0 }
        };
      }

      // Process tickets in parallel with rate limiting
      const batchSize = 3; // Process 3 tickets at a time
      for (let i = 0; i < tickets.length; i += batchSize) {
        const batch = tickets.slice(i, i + batchSize);
        const batchPromises = batch.map(async (ticket) => {
          try {
            const outreachResult = await this.generateOutreach({
              ticketId: ticket.id,
              messageType: params.messageType,
              context: params.context,
              trackingEnabled: params.trackingEnabled
            });

            result.successful.push({
              ticketId: ticket.id,
              message: outreachResult.message,
              metadata: outreachResult.metadata
            });

            return true;
          } catch (error) {
            result.failed.push({
              ticketId: ticket.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
          }
        });

        await Promise.all(batchPromises);

        // Add a small delay between batches to prevent rate limiting
        if (i + batchSize < tickets.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate summary
      const endTime = Date.now();
      result.summary = {
        total: tickets.length,
        succeeded: result.successful.length,
        failed: result.failed.length,
        averageGenerationTime: (endTime - startTime) / tickets.length
      };

      // Log batch generation metrics
      await this.logAction('BATCH_OUTREACH_GENERATION', {
        projectId: params.projectId,
        totalTickets: tickets.length,
        successCount: result.successful.length,
        failureCount: result.failed.length,
        averageGenerationTime: result.summary.averageGenerationTime,
        filters: params.filters
      });

      return result;

    } catch (error) {
      console.error('Error in batchGenerateOutreach:', error);
      throw error;
    }
  }

  private async calculateQualificationScore(
    companyData: any,
    personData: any
  ): Promise<number> {
    const scoreFactors = {
      companySize: this.scoreCompanySize(companyData.overview?.size),
      industry: this.scoreIndustryFit(companyData.industry),
      techStack: this.scoreTechStack(companyData.overview?.technology),
      growth: this.scoreGrowthPotential(companyData.overview?.growth),
      personRole: this.scorePersonRole(personData.role),
      engagement: this.scoreEngagementPotential(personData)
    };

    return Object.values(scoreFactors).reduce((sum, score) => sum + score, 0) / 
           Object.keys(scoreFactors).length * 100;
  }

  private formatResearchSummary(companyData: any, personData: any): string {
    return `Research Summary

Contact Information:
${personData.name || 'Name not available'}
${personData.role || 'Role not found'}
${personData.email || 'Email not available'}

Company Overview:
${companyData.overview || 'No overview available'}

Key Findings:
${this.formatKeyFindings(companyData, personData)}

Recent Developments:
${companyData.recent_developments || 'No recent developments available'}

Recommended Approach:
${this.generateApproachRecommendation(companyData, personData)}`;
  }

  private formatKeyFindings(companyData: any, personData: any): string {
    const findings = [];
    
    if (companyData.size) findings.push(`Company Size: ${companyData.size}`);
    if (companyData.industry) findings.push(`Industry: ${companyData.industry}`);
    if (companyData.technology) {
      const tech = Array.isArray(companyData.technology) 
        ? companyData.technology.join(', ')
        : companyData.technology;
      findings.push(`Tech Stack: ${tech}`);
    }
    if (personData.interests) {
      const interests = Array.isArray(personData.interests)
        ? personData.interests.join(', ')
        : personData.interests;
      findings.push(`Interests: ${interests}`);
    }
    
    return findings.join('\n');
  }

  private generateApproachRecommendation(companyData: any, personData: any): string {
    const recommendations = [];
    
    if (Array.isArray(personData.pain_points) && personData.pain_points.length > 0) {
      recommendations.push(`Focus on addressing: ${personData.pain_points.join(', ')}`);
    }
    
    if (Array.isArray(personData.interests) && personData.interests.length > 0) {
      recommendations.push(`Align with interests: ${personData.interests.join(', ')}`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Insufficient data to generate specific recommendations');
    }
    
    return recommendations.join('\n');
  }

  private createOutreachContext(ticket: any, messageType: string): string {
    const prospectData = ticket.metadata.prospect_data;
    const researchData = ticket.metadata.research_data;
    const previousMessages = ticket.zen_ticket_messages
      .filter((msg: any) => msg.source === 'ai')
      .map((msg: any) => msg.content)
      .join('\n');

    return `Contact: ${prospectData.name} (${prospectData.role})
Company: ${prospectData.company}
Industry: ${researchData.company.industry}
Research Summary: ${JSON.stringify(researchData, null, 2)}
Previous Messages: ${previousMessages}`;
  }

  private getOutreachPrompt(messageType: string): string {
    switch (messageType) {
      case 'initial':
        return 'Generate an initial outreach message that introduces our company and value proposition';
      case 'followup':
        return 'Generate a follow-up message that builds on our previous conversation';
      case 'proposal':
        return 'Generate a message that presents our proposal and next steps';
      default:
        return 'Generate a professional and engaging message';
    }
  }

  private determineInitialPriority(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  // Scoring helper methods
  private scoreCompanySize(size?: string): number {
    if (!size) return 0.5;
    const sizes = {
      enterprise: 1.0,
      large: 0.8,
      medium: 0.6,
      small: 0.4
    } as const;
    
    return (size.toLowerCase() in sizes) 
      ? sizes[size.toLowerCase() as keyof typeof sizes] 
      : 0.5;
  }

  private scoreIndustryFit(industry?: string): number {
    if (!industry) return 0.5;
    const targetIndustries = ['technology', 'saas', 'finance', 'healthcare', 'education'];
    return targetIndustries.includes(industry.toLowerCase()) ? 0.8 : 0.4;
  }

  private scoreTechStack(tech?: string[]): number {
    if (!tech?.length) return 0.5;
    const relevantTech = ['react', 'typescript', 'node', 'python', 'aws'];
    const matches = tech.filter(t => 
      relevantTech.includes(t.toLowerCase())
    ).length;
    return Math.min(matches / relevantTech.length, 1);
  }

  private scoreGrowthPotential(growth?: any): number {
    if (!growth) return 0.5;
    return growth.trend === 'up' ? 0.8 : 0.4;
  }

  private scorePersonRole(role?: string): number {
    if (!role) return 0.5;
    const targetRoles = ['cto', 'vp', 'director', 'head', 'lead'];
    return targetRoles.some(r => role.toLowerCase().includes(r)) ? 0.9 : 0.5;
  }

  private scoreEngagementPotential(personData: any): number {
    if (!personData) return 0.5;
    let score = 0.5;
    
    if (personData.active_on_linkedin) score += 0.2;
    if (personData.recent_job_change) score += 0.2;
    if (personData.interests?.length > 0) score += 0.1;
    
    return Math.min(score, 1);
  }
}
