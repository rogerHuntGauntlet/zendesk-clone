import { config } from 'dotenv';
import * as path from 'path';
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";

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

export async function testOutreachLangsmith() {
  try {
    console.log("Starting Outreach Langsmith test...");
    console.log("Project:", OUTREACH_PROJECT_NAME);
    
    // Verify project exists or create it
    try {
      await client.readProject({ projectName: OUTREACH_PROJECT_NAME });
      console.log("Project exists:", OUTREACH_PROJECT_NAME);
    } catch (e) {
      console.log("Creating project:", OUTREACH_PROJECT_NAME);
      await client.createProject({ projectName: OUTREACH_PROJECT_NAME });
    }

    // Create a simple chain
    const model = new ChatOpenAI({
      temperature: 0.7,
      modelName: "gpt-4",
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    const prompt = PromptTemplate.fromTemplate(
      "Write a one sentence test message to {name}."
    );

    const chain = new LLMChain({
      llm: model,
      prompt,
      verbose: true,
      callbacks: [
        new LangChainTracer({
          projectName: OUTREACH_PROJECT_NAME,
        }),
        {
          handleLLMStart: () => {
            console.log("LLM started with tracing enabled");
            console.log("Current project:", OUTREACH_PROJECT_NAME);
          }
        }
      ],
      tags: ["test", "outreach"],
    });

    // Run the chain
    console.log("Running test chain...");
    const result = await chain.call(
      {
        name: "Test Prospect",
      },
      {
        tags: ["test-run"],
        metadata: { projectName: OUTREACH_PROJECT_NAME }
      }
    );

    console.log("Test completed successfully!");
    console.log("Result:", result);
    return {
      success: true,
      result
    };

  } catch (error) {
    console.error("Outreach Langsmith test failed:", error);
    return {
      success: false,
      error
    };
  }
}

// Run test if file is executed directly
if (require.main === module) {
  testOutreachLangsmith()
    .then((result) => {
      console.log("Test execution completed:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
} 