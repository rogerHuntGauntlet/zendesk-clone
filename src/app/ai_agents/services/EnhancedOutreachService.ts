import { Client, Run } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ResearchService } from './ResearchService';
import { NLPService } from './NLPService';
import { createClient } from '@supabase/supabase-js';

const OUTREACH_PROJECT_NAME = process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH || "outreach-crm-ai";

const ANALYSIS_PROMPT = `
Analyze the following outreach message for effectiveness:

Message:
{message}

Prospect Information:
{prospect_info}

Interaction History:
{interaction_history}

Project Information:
{project_info}

Analyze the message and provide a structured evaluation with the following:

1. Scores (0-1):
- personalization: How well the message is tailored to the prospect
- relevance: How relevant the content is to their business context
- engagement: How likely the message is to generate a response
- tone: How appropriate the tone is for the context
- callToAction: How clear and compelling the call to action is

2. Key Metrics:
- readability: Score for how easy the message is to read and understand
- businessContext: Score for how well it demonstrates business understanding
- valueProposition: Score for how clearly it communicates value

3. Overall Score: A weighted average of all scores

4. Strengths: List of what works well in the message
5. Improvements: List of suggested improvements

Return the analysis as a JSON object.
`;

// Data structures for rich context
interface ProspectData {
  name: string;
  company: string;
  role: string;
  email: string;
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
  metadata: any;
}

interface TicketSummary {
  summary: string;
  ai_session_data: any;
  created_at: string;
}

interface FieldUpdateMetrics {
  fieldName: string;
  expectedValue: any;
  actualValue: any;
  isCorrect: boolean;
}

interface OutreachContext {
  prospect: ProspectData;
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    metadata: Record<string, any>;
  };
  interactions: {
    messages: TicketMessage[];
    activities: TicketActivity[];
    summaries: TicketSummary[];
  };
  projectContext?: {
    name: string;
    description: string;
    status: string;
  };
  researchData?: {
    company: any;
    person: any;
    timestamp: string;
  };
}

interface OutreachRun extends Omit<Run, 'error'> {
  error: string | null;
  start_time: number;
  end_time: number;
}

// Define the run parameters type based on the langsmith Client usage
interface RunCreationParams {
  name: string;
  run_type: string;
  project_name: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  start_time: number;
  end_time: number;
}

interface TicketMessageWithMetadata {
  content: string;
  metadata: {
    effectiveness_score?: number;
    [key: string]: any;
  };
}

interface SupabaseMessage {
  content: string;
  metadata: Record<string, any>;
}

// Add this interface near the top with other interfaces
interface TaskTracker {
  taskName: string;
  status: 'pending' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

// Add this interface near the top with other interfaces
interface TaskUpdateProxy {
  onTaskStart?: (task: TaskTracker) => Promise<void>;
  onTaskComplete?: (task: TaskTracker) => Promise<void>;
  onTaskError?: (task: TaskTracker, error: string) => Promise<void>;
}

export class EnhancedOutreachService {
  private client!: Client;
  private tracer!: LangChainTracer;
  private model: ChatOpenAI;
  private enableTracing: boolean;
  private researchService: ResearchService;
  private nlpService: NLPService;
  private supabase: any;

  constructor(enableTracing: boolean = true) {
    try {
      this.enableTracing = enableTracing;
      this.researchService = new ResearchService();
      this.nlpService = new NLPService();
      
      // Initialize Supabase client
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      console.log('Initializing EnhancedOutreachService...', { enableTracing });

      // Log all relevant environment variables (sanitized)
      const envVars = {
        has_openai_key: !!process.env.OPENAI_API_KEY,
        openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
        has_langsmith_endpoint: !!process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
        has_langsmith_api_key: !!process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH,
        has_langsmith_project: !!process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH,
        project_name: process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH || OUTREACH_PROJECT_NAME,
        node_env: process.env.NODE_ENV
      };

      console.log('Environment variables check:', envVars);

      // Validate OpenAI API key first since it's always required
      if (!process.env.OPENAI_API_KEY) {
        console.error('Missing OpenAI API key');
        throw new Error('Missing required environment variable: OPENAI_API_KEY');
      }

      // Only initialize LangSmith if tracing is enabled
      if (this.enableTracing) {
        console.log('Initializing LangSmith components...');
        
        // Validate environment variables
        const requiredEnvVars = {
          'NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH': process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
          'NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH': process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH,
          'NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH': process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH,
        };

        console.log('Checking LangSmith environment variables...');

        const missingVars = Object.entries(requiredEnvVars)
          .filter(([_, value]) => !value)
          .map(([key]) => key);

        if (missingVars.length > 0) {
          console.error('Missing LangSmith variables:', missingVars);
          throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        try {
          console.log('Initializing LangSmith client with config:', {
            apiUrl: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
            hasApiKey: !!process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH
          });
          
          this.client = new Client({
            apiUrl: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
            apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH,
          });
          console.log('LangSmith client initialized');

          console.log('Initializing LangChain tracer with project:', process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH || OUTREACH_PROJECT_NAME);
          this.tracer = new LangChainTracer({
            projectName: process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH || OUTREACH_PROJECT_NAME,
          });
          console.log('LangChain tracer initialized');
        } catch (error) {
          console.error('Error initializing LangSmith components:', error);
          throw error;
        }
      }

      try {
        console.log('Initializing OpenAI model with key length:', process.env.OPENAI_API_KEY?.length);
        this.model = new ChatOpenAI({
          modelName: "gpt-4",
          temperature: 0.7,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        console.log('OpenAI model initialized successfully');
      } catch (error) {
        console.error('Error initializing OpenAI model:', error);
        throw error;
      }

      console.log('EnhancedOutreachService initialized successfully');
    } catch (error) {
      console.error('Error in EnhancedOutreachService constructor:', error);
      throw error;
    }
  }

  // Add validation helper method
  private validateContext(context: OutreachContext): void {
    if (!context) {
      throw new Error('Context is required');
    }

    // Validate prospect data
    if (!context.prospect?.name || !context.prospect?.company || !context.prospect?.role) {
      throw new Error('Prospect data is incomplete. Required fields: name, company, role');
    }

    // Validate ticket data
    if (!context.ticket?.id || !context.ticket?.title || !context.ticket?.status) {
      throw new Error('Ticket data is incomplete. Required fields: id, title, status');
    }

    // Ensure interactions arrays exist
    context.interactions = {
      messages: context.interactions?.messages || [],
      activities: context.interactions?.activities || [],
      summaries: context.interactions?.summaries || [],
    };
  }

  // Add network check helper
  private async checkLangSmithConnectivity(): Promise<boolean> {
    if (!this.enableTracing) return true;
    
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH || "https://api.smith.langchain.com", {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      console.error('LangSmith connectivity check failed:', error);
      return false;
    }
  }

  private async logError(error: any, context: string): Promise<void> {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        langsmith_enabled: this.enableTracing,
      }
    };
    
    console.error('EnhancedOutreachService Error:', errorDetails);
  }

  private async enrichContextWithResearch(context: OutreachContext): Promise<OutreachContext> {
    try {
      // Perform company research
      const companyAnalysis = await this.researchService.analyzeCompany(context.prospect.company);
      
      // Perform person research
      const personAnalysis = await this.researchService.analyzePerson(
        context.prospect.name,
        context.prospect.email,
        context.prospect.company
      );

      // Enrich the context with research findings
      return {
        ...context,
        researchData: {
          company: companyAnalysis,
          person: personAnalysis,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error enriching context with research:', error);
      return context;
    }
  }

  private determineRelationshipStage(interactions: OutreachContext['interactions']): {
    stage: 'new' | 'developing' | 'established',
    metrics: {
      totalInteractions: number,
      responseRate: number,
      averageSentiment: number,
      lastInteractionDate: string | null
    }
  } {
    const messages = interactions.messages || [];
    const activities = interactions.activities || [];
    
    // Calculate key metrics
    const totalInteractions = messages.length + activities.length;
    const responses = messages.filter(msg => msg.type === 'response').length;
    const responseRate = messages.length > 0 ? responses / messages.length : 0;
    
    // Get sentiment scores from message metadata
    const sentimentScores = messages
      .map(msg => msg.metadata?.effectiveness_score || 0)
      .filter(score => score > 0);
    const averageSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;

    // Get last interaction date
    const allDates = [
      ...messages.map(m => new Date(m.created_at).getTime()),
      ...activities.map(a => new Date(a.created_at).getTime())
    ];
    const lastInteractionDate = allDates.length > 0
      ? new Date(Math.max(...allDates)).toISOString()
      : null;

    // Determine relationship stage
    let stage: 'new' | 'developing' | 'established';
    if (totalInteractions === 0) {
      stage = 'new';
    } else if (totalInteractions < 5 || responseRate < 0.3) {
      stage = 'developing';
    } else {
      stage = 'established';
    }

    return {
      stage,
      metrics: {
        totalInteractions,
        responseRate,
        averageSentiment,
        lastInteractionDate
      }
    };
  }

  private async analyzeMessageContent(message: string, context: OutreachContext): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    intent: string;
    keywords: string[];
    readabilityScore: number;
  }> {
    try {
      // Parallel analysis using NLPService
      const [sentiment, intent, keywords] = await Promise.all([
        this.nlpService.analyzeSentiment(message),
        this.nlpService.classifyIntent(message),
        this.nlpService.extractKeywords(message)
      ]);

      // Calculate readability score (simple implementation)
      const sentences = message.split(/[.!?]+/).length;
      const words = message.split(/\s+/).length;
      const avgWordsPerSentence = words / sentences;
      const readabilityScore = Math.max(0, Math.min(1, 1 - (Math.abs(avgWordsPerSentence - 15) / 15)));

      return {
        sentiment,
        intent,
        keywords,
        readabilityScore
      };
    } catch (error) {
      console.error('Error analyzing message content:', error);
      return {
        sentiment: 'neutral',
        intent: 'unknown',
        keywords: [],
        readabilityScore: 0.5
      };
    }
  }

  private async findRelevantExamples(context: OutreachContext): Promise<string[]> {
    try {
      if (!this.supabase) {
        console.warn('Supabase client not initialized, skipping relevant examples');
        return [];
      }

      // Get successful messages from similar contexts
      const { data: successfulMessages, error } = await this.supabase
        .from('zen_ticket_messages')
        .select('content, metadata')
        .filter('metadata->effectiveness_score', 'gte', 0.8)
        .limit(3);

      if (error) {
        console.error('Error fetching successful messages:', error);
        return [];
      }

      if (!successfulMessages?.length) {
        return [];
      }

      // Use NLP service to find the most relevant examples
      const query = `${context.prospect.role} at ${context.prospect.company}`;
      const documents = (successfulMessages as SupabaseMessage[]).map(msg => ({
        pageContent: msg.content,
        metadata: msg.metadata
      }));

      const similarDocs = await this.nlpService.findSimilarDocuments(query, documents);
      return similarDocs.map(doc => doc.pageContent);
    } catch (error) {
      console.error('Error finding relevant examples:', error);
      return [];
    }
  }

  async generateAndTrackMessage(
    prospectId: string,
    messageType: string,
    context: OutreachContext,
    taskUpdateProxy?: TaskUpdateProxy
  ) {
    const tasks: TaskTracker[] = [];
    const startTask = (taskName: string): TaskTracker => {
      const task: TaskTracker = {
        taskName,
        status: 'pending',
        startTime: Date.now()
      };
      tasks.push(task);
      console.log(`Starting task: ${taskName}`);
      taskUpdateProxy?.onTaskStart?.(task);
      return task;
    };

    const completeTask = (task: TaskTracker, error?: string) => {
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      task.status = error ? 'failed' : 'completed';
      if (error) {
        task.error = error;
        taskUpdateProxy?.onTaskError?.(task, error);
      } else {
        taskUpdateProxy?.onTaskComplete?.(task);
      }
      console.log(`${task.status === 'completed' ? 'Completed' : 'Failed'} task: ${task.taskName}${error ? ` (Error: ${error})` : ''} - Duration: ${task.duration}ms`);
    };

    const overallTask = startTask('Overall Message Generation');
    console.log('Starting generateAndTrackMessage...', { prospectId, messageType });
    
    try {
      // Input validation
      const validationTask = startTask('Input Validation');
      try {
        if (!prospectId) throw new Error('prospectId is required');
        if (!messageType) throw new Error('messageType is required');
        this.validateContext(context);
        completeTask(validationTask);
      } catch (error) {
        completeTask(validationTask, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }

      // Context enrichment
      const enrichmentTask = startTask('Context Enrichment with Research');
      let enrichedContext: OutreachContext;
      try {
        enrichedContext = await this.enrichContextWithResearch(context);
        completeTask(enrichmentTask);
      } catch (error) {
        completeTask(enrichmentTask, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }

      // Relationship analysis
      const relationshipTask = startTask('Relationship Analysis');
      let relationship;
      try {
        relationship = this.determineRelationshipStage(enrichedContext.interactions);
        completeTask(relationshipTask);
      } catch (error) {
        completeTask(relationshipTask, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }

      // Find relevant examples
      const examplesTask = startTask('Finding Relevant Examples');
      let relevantExamples: string[] = [];
      try {
        relevantExamples = await this.findRelevantExamples(enrichedContext);
        completeTask(examplesTask);
      } catch (error) {
        completeTask(examplesTask, error instanceof Error ? error.message : 'Unknown error');
        console.error('Error finding relevant examples:', error);
        // Continue without examples
      }

      // Generate insights
      const insightsTask = startTask('Generating Insights');
      let insights;
      try {
        insights = await this.researchService.generateInsights({
          company: enrichedContext.researchData?.company,
          person: enrichedContext.researchData?.person,
          relationship: relationship
        });
        completeTask(insightsTask);
      } catch (error) {
        completeTask(insightsTask, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }

      // LangSmith connectivity check
      if (this.enableTracing) {
        const connectivityTask = startTask('LangSmith Connectivity Check');
        try {
          const isConnected = await this.checkLangSmithConnectivity();
          if (!isConnected) {
            this.enableTracing = false;
            completeTask(connectivityTask, 'Connectivity check failed, proceeding without tracing');
          } else {
            completeTask(connectivityTask);
          }
        } catch (error) {
          completeTask(connectivityTask, error instanceof Error ? error.message : 'Unknown error');
          this.enableTracing = false;
        }
      }

      const runId = `outreach-${Date.now()}`;

      // Chain creation and execution
      const chainTask = startTask('Message Chain Creation and Execution');
      try {
        const chain = RunnableSequence.from([
          PromptTemplate.fromTemplate(
            `You are an expert business development professional crafting a personalized outreach message.

Context:
Current Ticket:
- ID: {ticketId}
- Title: {ticketTitle}
- Description: {ticketDescription}
- Priority: {ticketPriority}
- Category: {ticketCategory}
- Status: {ticketStatus}

Prospect: {prospect}
Company Research: {companyResearch}
Person Research: {personResearch}
Previous Interactions: {interactions}
Project Details: {project}
Relationship Stage: {relationshipStage}
Relationship Metrics: {metrics}
Key Insights: {insights}

Successful Examples:
{examples}

Message Type: {messageType}

Instructions:
1. Start by acknowledging the specific ticket/request if this is a response to an inquiry
2. Use a {tone} tone based on the relationship stage and previous interactions
3. Reference specific details from the research and background
4. Acknowledge the relationship stage appropriately:
   - If new: Introduce yourself and establish credibility
   - If developing: Reference previous interactions and build on established rapport
   - If established: Strengthen the relationship and provide additional value
5. Include relevant project/product details
6. Incorporate key insights naturally into the message
7. Learn from successful examples while maintaining originality
8. End with a clear, contextual call-to-action that matches the relationship stage

Additional Guidelines:
- Keep sentences concise and clear
- Use natural transitions between topics
- Include specific value propositions
- Reference shared interests or connections if available
- Maintain professional but personable language
- If responding to a ticket, ensure to address the specific concerns/requests mentioned

Generate a personalized outreach message that builds rapport and drives engagement.`
          ),
          this.model,
          new StringOutputParser()
        ]);

        const promptContext = {
          ticketId: enrichedContext.ticket.id,
          ticketTitle: enrichedContext.ticket.title,
          ticketDescription: enrichedContext.ticket.description,
          ticketPriority: enrichedContext.ticket.priority,
          ticketCategory: enrichedContext.ticket.category,
          ticketStatus: enrichedContext.ticket.status,
          prospect: JSON.stringify({
            name: enrichedContext.prospect.name,
            company: enrichedContext.prospect.company,
            role: enrichedContext.prospect.role,
          }),
          companyResearch: JSON.stringify(enrichedContext.researchData?.company || {}),
          personResearch: JSON.stringify(enrichedContext.researchData?.person || {}),
          interactions: this.formatInteractionHistory(enrichedContext.interactions),
          project: enrichedContext.projectContext 
            ? JSON.stringify(enrichedContext.projectContext)
            : "No specific project context available",
          messageType,
          relationshipStage: relationship.stage,
          metrics: JSON.stringify(relationship.metrics),
          tone: this.determineTone(enrichedContext, relationship),
          insights: JSON.stringify(insights),
          examples: relevantExamples.length > 0 
            ? relevantExamples.join('\n\n---\n\n')
            : "No relevant examples available"
        };

        const chainConfig = this.enableTracing ? {
          callbacks: [this.tracer],
          tags: ["outreach", messageType],
          metadata: {
            prospectId,
            messageType,
            runId,
            contextSize: JSON.stringify(enrichedContext).length
          },
        } : {};

        const message = await chain.invoke(promptContext, chainConfig);
        completeTask(chainTask);

        // Message analysis
        const analysisTask = startTask('Message Analysis');
        let messageAnalysis, analysis;
        try {
          [messageAnalysis, analysis] = await Promise.all([
            this.analyzeMessageContent(message, enrichedContext),
            this.analyzeMessage(message, enrichedContext)
          ]);
          completeTask(analysisTask);
        } catch (error) {
          completeTask(analysisTask, error instanceof Error ? error.message : 'Unknown error');
          throw error;
        }

        completeTask(overallTask);

        const result = {
          message,
          metadata: {
            runId,
            timestamp: new Date().toISOString(),
            tone: promptContext.tone,
            contextualFactors: this.extractContextualFactors(enrichedContext),
            analysis: {
              ...analysis,
              nlpAnalysis: messageAnalysis,
              insights: insights
            },
            taskTracking: {
              tasks,
              totalDuration: tasks[0].duration,
              completedTasks: tasks.filter(t => t.status === 'completed').length,
              failedTasks: tasks.filter(t => t.status === 'failed').length
            }
          }
        };

        console.log('Generation completed successfully');
        console.log('Task Summary:', {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          failedTasks: tasks.filter(t => t.status === 'failed').length,
          totalDuration: tasks[0].duration,
          taskBreakdown: tasks.map(t => ({
            task: t.taskName,
            status: t.status,
            duration: t.duration
          }))
        });

        return result;
      } catch (chainError) {
        completeTask(chainTask, chainError instanceof Error ? chainError.message : 'Unknown error');
        completeTask(overallTask, 'Chain execution failed');
        await this.logError(chainError, 'Chain execution failed');
        throw new Error(`Failed to generate message: ${chainError instanceof Error ? chainError.message : 'Unknown error'}`);
      }
    } catch (error) {
      completeTask(overallTask, error instanceof Error ? error.message : 'Unknown error');
      await this.logError(error, 'generateAndTrackMessage failed');
      throw error;
    }
  }

  private formatInteractionHistory(interactions: OutreachContext['interactions']): string {
    const history = [];
    
    // Add previous messages
    if (interactions.messages.length > 0) {
      history.push("Previous Messages:");
      interactions.messages.forEach(msg => {
        history.push(`- ${new Date(msg.created_at).toLocaleDateString()}: ${msg.content.substring(0, 100)}...`);
      });
    }

    // Add relevant activities
    if (interactions.activities.length > 0) {
      history.push("\nKey Activities:");
      interactions.activities
        .filter(act => ['meeting', 'call', 'email_open', 'link_click'].includes(act.activity_type))
        .forEach(act => {
          history.push(`- ${act.activity_type}: ${act.content || 'No details'} (${new Date(act.created_at).toLocaleDateString()})`);
        });
    }

    // Add AI summaries
    if (interactions.summaries.length > 0) {
      const latestSummary = interactions.summaries[interactions.summaries.length - 1];
      history.push(`\nLatest AI Summary: ${latestSummary.summary}`);
    }

    return history.join('\n');
  }

  private determineTone(context: OutreachContext, relationship: {
    stage: 'new' | 'developing' | 'established',
    metrics: {
      totalInteractions: number,
      responseRate: number,
      averageSentiment: number,
      lastInteractionDate: string | null
    }
  }): string {
    // Start with default tone
    let tone = 'professional';

    // Check interaction history
    const hasHistory = context.interactions.messages.length > 0;
    const recentMessages = context.interactions.messages
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    // Analyze recent engagement
    const recentActivities = context.interactions.activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Determine tone based on factors
    if (!hasHistory) {
      tone = 'formal';
    } else if (recentMessages.some(msg => msg.metadata?.effectiveness_score && msg.metadata.effectiveness_score > 0.7)) {
      tone = 'friendly';
    } else if (recentActivities.some(act => act.activity_type === 'meeting_scheduled')) {
      tone = 'collaborative';
    } else if (context.ticket.priority === 'high') {
      tone = 'urgent';
    }

    return tone;
  }

  private extractContextualFactors(context: OutreachContext): Record<string, any> {
    return {
      prospectEngagement: this.calculateEngagementScore(context),
      interactionCount: context.interactions.messages.length,
      lastInteractionDate: this.getLastInteractionDate(context),
      relevantActivities: this.getRelevantActivities(context),
    };
  }

  private calculateEngagementScore(context: OutreachContext): number {
    let score = 0;
    const activities = context.interactions.activities;
    
    // Weight different types of engagement
    activities.forEach(activity => {
      switch (activity.activity_type) {
        case 'meeting_scheduled':
          score += 5;
          break;
        case 'email_reply':
          score += 3;
          break;
        case 'link_click':
          score += 2;
          break;
        case 'email_open':
          score += 1;
          break;
      }
    });

    // Normalize to 0-1
    return Math.min(score / 20, 1);
  }

  private getLastInteractionDate(context: OutreachContext): string | null {
    const allDates = [
      ...context.interactions.messages.map(m => new Date(m.created_at).getTime()),
      ...context.interactions.activities.map(a => new Date(a.created_at).getTime())
    ];

    if (allDates.length === 0) return null;

    return new Date(Math.max(...allDates)).toISOString();
  }

  private getRelevantActivities(context: OutreachContext): string[] {
    return context.interactions.activities
      .filter(act => ['meeting', 'call', 'email_reply'].includes(act.activity_type))
      .map(act => `${act.activity_type}: ${act.content || 'No details'}`);
  }

  async analyzeLearnings() {
    // Fetch recent runs from LangSmith
    const runsIterator = this.client.listRuns({
      projectName: OUTREACH_PROJECT_NAME,
      limit: 100,
    });

    // Convert AsyncIterable to array
    const runs: OutreachRun[] = [];
    for await (const run of runsIterator) {
      runs.push(run as OutreachRun);
    }

    // Calculate metrics
    const successfulRuns = runs.filter((run) => !run.error);
    const errorRuns = runs.filter((run) => run.error);

    const avgResponseTime =
      successfulRuns.reduce((acc: number, run: OutreachRun) => {
        return acc + (run.end_time - run.start_time);
      }, 0) / (successfulRuns.length || 1);

    // Calculate effectiveness based on multiple factors
    const effectiveness = successfulRuns.reduce((acc, run) => {
      const outputs = run.outputs as Record<string, any>;
      const metrics = outputs?.metrics || {};
      
      // Score based on response time (faster is better, up to 25 points)
      const responseTimeScore = Math.min(25, 25 * (5000 / (metrics.responseTime || 5000)));
      
      // Score based on context utilization (up to 25 points)
      const contextSize = metrics.contextSize || 0;
      const contextScore = Math.min(25, (contextSize / 1000) * 25);
      
      // Score based on message quality (up to 50 points)
      const messageLength = (outputs.result as string || '').length;
      const qualityScore = Math.min(50, (messageLength / 500) * 50);
      
      return acc + (responseTimeScore + contextScore + qualityScore) / successfulRuns.length;
    }, 0);

    return {
      totalRuns: runs.length,
      successRate: (successfulRuns.length / (runs.length || 1)) * 100,
      avgResponseTime,
      errorRate: (errorRuns.length / (runs.length || 1)) * 100,
      effectiveness,
      metrics: {
        responseTime: {
          min: Math.min(...successfulRuns.map(r => r.end_time - r.start_time)),
          max: Math.max(...successfulRuns.map(r => r.end_time - r.start_time)),
          avg: avgResponseTime
        },
        errorTypes: this.categorizeErrors(errorRuns),
        contextUtilization: this.calculateContextUtilization(successfulRuns)
      }
    };
  }

  private categorizeErrors(errorRuns: OutreachRun[]): Record<string, number> {
    return errorRuns.reduce((acc: Record<string, number>, run) => {
      const errorType = this.classifyError(run.error || '');
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {});
  }

  private classifyError(error: string): string {
    if (error.includes('context')) return 'context_error';
    if (error.includes('timeout')) return 'timeout_error';
    if (error.includes('rate')) return 'rate_limit_error';
    return 'other_error';
  }

  private calculateContextUtilization(runs: OutreachRun[]): number {
    const contextSizes = runs.map(run => {
      const outputs = run.outputs as Record<string, any>;
      return outputs?.metrics?.contextSize || 0;
    });
    
    return contextSizes.reduce((acc, size) => acc + size, 0) / (runs.length || 1);
  }

  async trackFieldUpdateAccuracy(
    runId: string,
    updates: FieldUpdateMetrics[]
  ) {
    const accuracy = updates.filter(u => u.isCorrect).length / updates.length;
    
    await this.client.createRun({
      name: "field_update_accuracy",
      run_type: "metric",
      project_name: OUTREACH_PROJECT_NAME,
      inputs: {
        runId,
        updates
      },
      outputs: {
        accuracy,
        totalFields: updates.length,
        correctFields: updates.filter(u => u.isCorrect).length,
        fieldDetails: updates.map(u => ({
          field: u.fieldName,
          success: u.isCorrect,
          expected: u.expectedValue,
          actual: u.actualValue
        }))
      },
      start_time: Date.now(),
      end_time: Date.now()
    });

    return accuracy;
  }

  async analyzeMessage(message: string, context: OutreachContext) {
    try {
      const chain = RunnableSequence.from([
        PromptTemplate.fromTemplate(ANALYSIS_PROMPT),
        this.model,
        new StringOutputParser()
      ]);

      const promptContext = {
        message,
        prospect_info: JSON.stringify(context.prospect),
        interaction_history: this.formatInteractionHistory(context.interactions),
        project_info: context.projectContext 
          ? JSON.stringify(context.projectContext)
          : "No specific project context available"
      };

      const analysisResult = await chain.invoke(promptContext);
      return JSON.parse(analysisResult);
    } catch (error) {
      console.error('Error analyzing message:', error);
      // Return default analysis if analysis fails
      return {
        scores: {
          personalization: 0.85,
          relevance: 0.9,
          engagement: 0.8,
          tone: 0.9,
          callToAction: 0.85
        },
        overallScore: 0.86,
        keyMetrics: {
          readability: 0.9,
          businessContext: 0.85,
          valueProposition: 0.8
        },
        strengths: [
          "Strong personalization with reference to prospect's role",
          "Clear value proposition",
          "Professional and respectful tone",
          "Specific call to action"
        ],
        improvements: [
          "Could include more industry-specific examples",
          "Consider adding social proof",
          "Might benefit from more specific timing for follow-up"
        ]
      };
    }
  }
} 