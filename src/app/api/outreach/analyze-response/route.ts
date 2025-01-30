import { NextResponse } from 'next/server';
import { Client, Run } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";
import { OpenAI } from 'openai';

const OUTREACH_PROJECT_NAME = process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH || "outreach-crm-ai";

// Initialize LangSmith components
const client = new Client({
    apiUrl: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
    apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH,
});

const tracer = new LangChainTracer({
    projectName: OUTREACH_PROJECT_NAME,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisResult {
    scores: {
        personalization: number;
        relevance: number;
        engagement: number;
        tone: number;
        callToAction: number;
    };
    keyMetrics: {
        readability: number;
        businessContext: number;
        valueProposition: number;
    };
    overallScore: number;
    strengths: string[];
    improvements: string[];
    analysis: string;
    projectContext?: {
        id: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
    };
}

export async function POST(req: Request) {
    let run: Run | undefined;

    try {
        const { generatedContent, context } = await req.json();

        if (!generatedContent || !context) {
            return NextResponse.json(
                { error: 'Missing required fields: generatedContent and context' },
                { status: 400 }
            );
        }

        // Start LangSmith run
        const runParams = {
            name: "Analyze Response",
            run_type: "chain",
            project_name: OUTREACH_PROJECT_NAME,
            inputs: { generatedContent, context },
            start_time: Date.now()
        };
        run = await client.createRun(runParams) as unknown as Run;

        const prompt = `Analyze the following outreach email for effectiveness:

Generated Email:
${generatedContent}

Context:
Prospect Name: ${context.prospect.name}
Role: ${context.prospect.role}
Company: ${context.prospect.company}
Industry: ${context.companyInfo?.industry || 'Unknown'}

Project Context:
Project ID: ${context.projectContext.id}
Title: ${context.projectContext.title}
Description: ${context.projectContext.description}
Priority: ${context.projectContext.priority}
Category: ${context.projectContext.category}
Status: ${context.projectContext.status}

Analyze the email and provide a detailed evaluation with the following metrics:

1. Scores (0-1):
- personalization: How well is the message tailored to the prospect's specific situation and needs?
- relevance: How relevant is the content to their business context and industry?
- engagement: How likely is the message to generate a response based on its hooks and value proposition?
- tone: How appropriate is the tone for a business communication with this prospect?
- callToAction: How clear and compelling is the call to action?

2. Key Metrics (0-1):
- readability: How easy is the message to read and understand?
- businessContext: How well does it demonstrate understanding of their business and project context?
- valueProposition: How clearly does it communicate value in relation to the project goals?

3. Overall Analysis:
- Calculate an overall effectiveness score (weighted average)
- List specific strengths (what works well)
- List potential improvements
- Provide a brief analysis of the message's effectiveness, particularly in relation to the project context

Format the response as a JSON object matching the AnalysisResult interface.
Ensure all numeric scores are between 0 and 1.
Include the project context in the response to maintain context through the UI.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are an expert in sales and marketing communication analysis. Provide detailed, objective analysis of outreach messages with special attention to how well they align with project goals and context."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const analysisResult = JSON.parse(completion.choices[0]?.message?.content || "{}") as AnalysisResult;
        
        // Add project context to the analysis result
        const resultWithContext: AnalysisResult = {
            ...analysisResult,
            projectContext: context.projectContext
        };

        // Update LangSmith run with success
        if (run) {
            await client.updateRun(run.id, {
                end_time: Date.now(),
                outputs: { resultWithContext }
            });
        }

        return NextResponse.json(resultWithContext);

    } catch (error) {
        console.error('Error analyzing response:', error);

        // Update LangSmith run with error
        if (run) {
            await client.updateRun(run.id, {
                end_time: Date.now(),
                error: error instanceof Error ? error.message : 'Failed to analyze response',
                outputs: { error: 'Failed to analyze response' }
            });
        }

        return NextResponse.json(
            { error: 'Failed to analyze response' },
            { status: 500 }
        );
    }
} 