import { NextResponse } from 'next/server';
import { Client } from "langsmith";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { LangChainTracer } from "langchain/callbacks";

const client = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT_OUTREACH || "https://api.smith.langchain.com",
  apiKey: process.env.LANGSMITH_API_KEY_OUTREACH || "",
});

const projectName = process.env.LANGSMITH_PROJECT_OUTREACH || "outreach-crm-ai";

async function ensureProjectExists() {
  try {
    await client.readProject({ projectName });
    console.log("Project exists:", projectName);
  } catch (e) {
    console.log("Creating project:", projectName);
    await client.createProject({ projectName });
  }
}

async function generateTestRuns() {
  const model = new ChatOpenAI({
    temperature: 0.7,
    modelName: "gpt-4",
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  const scenarios = [
    {
      name: "Initial Outreach",
      prompt: "Write an initial outreach message to {name} about {product}.",
      vars: { name: "John Smith", product: "AI Assistant" }
    },
    {
      name: "Follow-up",
      prompt: "Write a follow-up message to {name} regarding their interest in {product}.",
      vars: { name: "Jane Doe", product: "AI Assistant" }
    },
    {
      name: "Meeting Request",
      prompt: "Write a meeting request to {name} to discuss {topic}.",
      vars: { name: "Alex Brown", topic: "AI implementation" }
    }
  ];

  for (const scenario of scenarios) {
    const prompt = PromptTemplate.fromTemplate(scenario.prompt);
    
    const chain = new LLMChain({
      llm: model,
      prompt,
      verbose: true,
      callbacks: [
        new LangChainTracer({
          projectName: projectName,
        })
      ],
      tags: ["test", "outreach", scenario.name.toLowerCase().replace(" ", "_")]
    });

    try {
      await chain.call(
        scenario.vars,
        {
          tags: ["test-run", scenario.name.toLowerCase().replace(" ", "_")],
          metadata: { 
            scenarioName: scenario.name,
            projectName: projectName,
            testType: "monitoring_setup"
          }
        }
      );
      console.log(`Generated test run for: ${scenario.name}`);
    } catch (error) {
      console.error(`Error generating test run for ${scenario.name}:`, error);
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const generateData = searchParams.get('generateData') === 'true';

    // Ensure project exists and generate test data if requested
    await ensureProjectExists();
    if (generateData) {
      await generateTestRuns();
    }

    // Fetch runs for the specified time range
    const runsIterable = await client.listRuns({
      projectName,
      filter: `start_time > '${startDate}' AND start_time < '${endDate}'`
    });

    // Convert AsyncIterable to array
    const runs = [];
    for await (const run of runsIterable) {
      runs.push(run);
    }

    // Calculate metrics
    const responseTimes = runs.map(run => {
      if (!run.end_time || !run.start_time) return 0;
      return new Date(run.end_time).getTime() - new Date(run.start_time).getTime();
    });

    const avgResponseTime = responseTimes.length ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    
    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p95ResponseTime = sortedResponseTimes[p95Index] || 0;

    const totalTokens = runs.reduce((sum, run) => {
      const tokens = run.extra?.tokens_total;
      return sum + (typeof tokens === 'number' ? tokens : 0);
    }, 0);

    const successfulRuns = runs.filter(run => run.error === null).length;
    const successRate = runs.length ? (successfulRuns / runs.length) * 100 : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        responseTimes: {
          avg: avgResponseTime,
          p95: p95ResponseTime
        },
        tokenUsage: {
          total: totalTokens,
          avgPerRun: runs.length ? totalTokens / runs.length : 0
        },
        successRate: {
          overall: successRate
        },
        totalRuns: runs.length,
        hasData: runs.length > 0
      }
    });

  } catch (error) {
    console.error('Error fetching LangSmith metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 