import { NextResponse } from 'next/server';
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { EnhancedOutreachService } from '@/app/ai_agents/services/EnhancedOutreachService';
import { OpenAI } from 'openai';
import { Run, RunParams } from "langsmith";

// Add these interfaces at the top of the file after the imports
interface MessageAnalysisScores {
  personalization: number;
  relevance: number;
  engagement: number;
  tone: number;
  callToAction: number;
}

interface MessageAnalysisKeyMetrics {
  readability: number;
  businessContext: number;
  valueProposition: number;
}

interface MessageAnalysis {
  scores: MessageAnalysisScores;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  keyMetrics: MessageAnalysisKeyMetrics;
}

interface PerformanceResult<T> {
  result: T;
  duration: number;
}

interface PerformanceError {
  error: Error;
  duration: number;
}

const OUTREACH_PROJECT_NAME = process.env.LANGSMITH_PROJECT_OUTREACH || "outreach-crm-ai";

// Initialize LangSmith components
const client = new Client({
  apiUrl: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
  apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH,
});

const tracer = new LangChainTracer({
  projectName: OUTREACH_PROJECT_NAME,
});

// Add placeholder detection patterns
const PLACEHOLDER_PATTERNS = [
  /\[.*?your\s+name.*?\]/i,
  /\[.*?company.*?\]/i,
  /\[.*?title.*?\]/i,
  /\[.*?role.*?\]/i,
  /\[.*?contact.*?\]/i,
  /\[.*?phone.*?\]/i,
  /\[.*?email.*?\]/i,
];

function detectPlaceholders(text: string): string[] {
  const placeholders: string[] = [];
  PLACEHOLDER_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      placeholders.push(matches[0]);
    }
  });
  return placeholders;
}

// Define the analysis prompt
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

Return the analysis as a JSON object matching the MessageAnalysis interface.
`;

// Add request validation schema
const validateRequest = (body: any) => {
  const requiredFields = ['prospectEmail', 'messageType', 'context'];
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate context structure
  const context = body.context;
  if (!context.prospect || !context.ticket) {
    throw new Error('Invalid context structure');
  }
};

// Add performance monitoring with proper typing
const measurePerformance = async <T>(fn: () => Promise<T>): Promise<PerformanceResult<T>> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    throw { 
      error: error instanceof Error ? error : new Error('Unknown error'), 
      duration 
    } as PerformanceError;
  }
};

export const dynamic = 'force-dynamic';

// Add GET handler for direct browser access
export async function GET(req: Request) {
  try {
    // Parse the URL-encoded body parameter
    const url = new URL(req.url);
    const bodyParam = url.searchParams.get('body');
    if (!bodyParam) {
      return new Response(JSON.stringify({
        error: 'Missing body parameter'
      }), {
        headers: { 'Content-Type': 'text/event-stream' },
        status: 400
      });
    }

    const body = JSON.parse(bodyParam);
    const { prospectId, messageType, context } = body;

    if (!prospectId || !messageType || !context) {
      return new Response(
        `data: ${JSON.stringify({
          error: 'Missing required fields: prospectId, messageType, and context are required'
        })}\n\n`,
        {
          headers: { 
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          status: 400
        }
      );
    }

    // Create response stream
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Simple OpenAI call for testing
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Write a professional email to ${context.prospect.name} who works at ${context.prospect.company} as ${context.prospect.role}.
    
    The email should be regarding this ticket:
    Title: ${context.ticket.title}
    Description: ${context.ticket.description}
    Priority: ${context.ticket.priority}
    
    Make it personalized, professional, and engaging. Keep it concise but effective.`;

    // Send initial task event
    await writer.write(new TextEncoder().encode(
      `event: task\ndata: ${JSON.stringify({
        type: 'started',
        task: {
          taskName: 'Generating Message',
          startTime: Date.now()
        }
      })}\n\n`
    ));

    const aiResponse = await model.invoke([{
      role: 'user',
      content: prompt
    }]);

    // Send completion task event
    await writer.write(new TextEncoder().encode(
      `event: task\ndata: ${JSON.stringify({
        type: 'completed',
        task: {
          taskName: 'Generating Message',
          startTime: Date.now() - 1000,
          endTime: Date.now()
        }
      })}\n\n`
    ));

    // Send complete event with result
    await writer.write(new TextEncoder().encode(
      `event: complete\ndata: ${JSON.stringify({
        result: {
          message: aiResponse.content,
          metadata: {
            model: "gpt-4",
            prompt,
            context: {
              prospect: context.prospect,
              ticket: {
                id: context.ticket.id,
                title: context.ticket.title
              }
            }
          }
        }
      })}\n\n`
    ));

    await writer.close();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in outreach generation:', error);
    return new Response(
      `data: ${JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        status: 500
      }
    );
  }
}

// Helper functions
function formatInteractionHistory(interactions: any[]): string {
  if (!interactions || !Array.isArray(interactions)) return "No previous interactions";
  
  return interactions
    .map((interaction: any) => {
      const date = new Date(interaction.created_at).toLocaleDateString();
      return `${date}: ${interaction.type} - ${interaction.content}`;
    })
    .join('\n');
}

function determineTone(context: any): string {
  const interactions = context.interactions || [];
  const hasHistory = interactions.length > 0;
  const lastInteraction = hasHistory ? interactions[interactions.length - 1] : null;
  
  if (!hasHistory) return 'formal';
  if (lastInteraction?.type === 'urgent') return 'urgent';
  if (interactions.length > 3) return 'friendly';
  return 'formal';
}

function extractContextualFactors(context: any) {
  return {
    prospectEngagement: calculateEngagementScore(context),
    interactionCount: (context.interactions?.messages || []).length,
    lastInteractionDate: getLastInteractionDate(context),
    relevantActivities: getRelevantActivities(context),
  };
}

function calculateEngagementScore(context: any): number {
  let score = 0;
  const activities = context.interactions?.activities || [];
  
  activities.forEach((activity: any) => {
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

  return Math.min(score / 20, 1);
}

function getLastInteractionDate(context: any): string | null {
  const messages = context.interactions?.messages || [];
  const activities = context.interactions?.activities || [];
  
  const allDates = [
    ...messages.map((m: any) => new Date(m.created_at).getTime()),
    ...activities.map((a: any) => new Date(a.created_at).getTime())
  ];

  if (allDates.length === 0) return null;

  return new Date(Math.max(...allDates)).toISOString();
}

function getRelevantActivities(context: any): string[] {
  return context.interactions?.activities
    ?.filter((act: any) => ['meeting', 'call', 'email_reply'].includes(act.activity_type))
    .map((act: any) => `${act.activity_type}: ${act.content || 'No details'}`) || [];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  let run: Run | undefined;

  try {
    const { analysis } = await req.json();
    console.log('🤖 Generating email with analysis:', analysis);

    // Start LangSmith run
    const runParams: RunParams = {
      name: "Generate Email",
      run_type: "chain",
      project_name: OUTREACH_PROJECT_NAME,
      inputs: { analysis },
      start_time: Date.now()
    };
    run = await client.createRun(runParams) as unknown as Run;

    const prompt = `Write a professional and engaging email to ${analysis.prospectInfo.name} based on the following analysis:

Prospect Information:
- Name: ${analysis.prospectInfo.name}
- Role: ${analysis.prospectInfo.role}
- Company: ${analysis.prospectInfo.company}

Company Details:
- Industry: ${analysis.companyInfo.industry}
- Size: ${analysis.companyInfo.size}
- Tech Stack: ${analysis.companyInfo.techStack.join(', ')}

Areas of Interest: ${analysis.interests.join(', ')}

Key Points to Address:
${analysis.keyPoints.map(point => `- ${point}`).join('\n')}

Suggested Approach: ${analysis.suggestedApproach}
Priority Level: ${analysis.priority}

The email should:
1. Address the prospect by name and reference their role/company
2. Demonstrate understanding of their industry and specific business context
3. Reference relevant points from their tech stack and interests
4. Address key points from the analysis
5. Follow the suggested approach
6. Include a clear, contextual call to action
7. Be concise yet personalized

Write only the email content, no subject line needed. Make it feel personal and tailored specifically to ${analysis.prospectInfo.name} at ${analysis.prospectInfo.company}.`;

    // Create the stream response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: "You are an experienced sales professional writing outreach emails to prospects."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            stream: true,
          });

          // Update LangSmith run with start of generation
          if (run) {
            await client.updateRun(run.id, {
              child_runs: [{
                name: "OpenAI Stream",
                run_type: "llm",
                inputs: { prompt },
                start_time: Date.now()
              }]
            });
          }

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'status', message: 'Starting generation...' })}\n\n`
            )
          );

          let generatedContent = '';
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              generatedContent += content;
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'content', content })}\n\n`
                )
              );
            }
          }

          // Update LangSmith run with success
          if (run) {
            await client.updateRun(run.id, {
              end_time: Date.now(),
              outputs: { generatedContent }
            });
          }

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'status', message: 'Generation complete' })}\n\n`
            )
          );
          controller.enqueue(
            new TextEncoder().encode('data: [DONE]\n\n')
          );
          controller.close();
        } catch (error) {
          console.error('❌ Error in stream:', error);
          
          // Update LangSmith run with error
          if (run) {
            await client.updateRun(run.id, {
              end_time: Date.now(),
              error: error instanceof Error ? error.message : 'Error in stream',
              outputs: { error: 'Error generating content' }
            });
          }

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Error generating content' })}\n\n`
            )
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Error in generate route:', error);
    
    // Update LangSmith run with error
    if (run) {
      await client.updateRun(run.id, {
        end_time: Date.now(),
        error: error instanceof Error ? error.message : 'Failed to generate email',
        outputs: { error: 'Failed to generate email' }
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    );
  }
} 