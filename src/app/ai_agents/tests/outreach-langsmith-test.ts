import { config } from 'dotenv';
import * as path from 'path';
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { EnhancedOutreachService } from '../services/EnhancedOutreachService';

// Configure environment for Outreach project
const OUTREACH_PROJECT_NAME = "outreach-crm-ai";  // Explicitly set project name
process.env.LANGSMITH_TRACING = process.env.LANGSMITH_TRACING_OUTREACH;
process.env.LANGSMITH_ENDPOINT = process.env.LANGSMITH_ENDPOINT_OUTREACH;
process.env.LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY_OUTREACH;
process.env.LANGSMITH_PROJECT = OUTREACH_PROJECT_NAME;

// Initialize Langsmith client
const client = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
  apiKey: process.env.LANGSMITH_API_KEY || "",
});

// Debug logging for Langsmith configuration
console.log("Langsmith Configuration:");
console.log("LANGSMITH_TRACING:", process.env.LANGSMITH_TRACING);
console.log("LANGSMITH_ENDPOINT:", process.env.LANGSMITH_ENDPOINT);
console.log("LANGSMITH_API_KEY:", process.env.LANGSMITH_API_KEY?.slice(0, 10) + "...");
console.log("LANGSMITH_PROJECT:", process.env.LANGSMITH_PROJECT);

export async function testOutreachSystem() {
  console.log("Starting Enhanced Outreach System Test...");
  
  const outreachService = new EnhancedOutreachService();

  // Test Cases for Different Scenarios
  const testCases = [
    {
      name: "Initial Contact - High Interest Prospect",
      type: "initial",
      content: "I noticed your recent achievements in AI development. Would love to discuss how our platform could help scale your efforts."
    },
    {
      name: "Follow-up - Medium Interest Prospect",
      type: "followup",
      content: "Following up on our previous conversation about AI development tools. Have you had a chance to review our documentation?"
    },
    {
      name: "Final Outreach - Low Interest Prospect",
      type: "final",
      content: "Just wanted to reach out one last time about our AI development platform. Our offer for a free trial is still available."
    }
  ];

  // Run test cases and collect metrics
  const results = [];
  for (const testCase of testCases) {
    console.log(`Running test case: ${testCase.name}`);

    // Generate and track message
    const result = await outreachService.generateAndTrackMessage(
      'test-prospect-' + Math.random(),
      testCase.type,
      testCase.content
    );

    results.push({
      testCase,
      result
    });

    // Add some delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Analyze overall performance
  const learnings = await outreachService.analyzeLearnings();

  // Log final results to LangSmith
  await client.createRun({
    name: "outreach_system_test",
    project_name: OUTREACH_PROJECT_NAME,
    inputs: {
      testCases: testCases.map(t => t.name)
    },
    outputs: {
      results,
      learnings,
      overallSuccess: learnings.effectiveness > 0.5
    }
  });

  return {
    results,
    learnings
  };
}

// Run the test if called directly
if (require.main === module) {
  testOutreachSystem()
    .then(results => {
      console.log("Test Results:", JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error("Test Error:", error);
      process.exit(1);
    });
} 