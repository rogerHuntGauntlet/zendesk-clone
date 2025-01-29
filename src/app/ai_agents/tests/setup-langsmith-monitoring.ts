import { config } from 'dotenv';
import * as path from 'path';
import { Client } from "langsmith";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { LangChainTracer } from "langchain/callbacks";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

// Configure environment for Outreach project
const OUTREACH_PROJECT_NAME = "outreach-crm-ai";

// Initialize Langsmith client with Outreach-specific credentials
const client = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT_OUTREACH || "https://api.smith.langchain.com",
  apiKey: process.env.LANGSMITH_API_KEY_OUTREACH || "",
});

// Debug logging
console.log("LangSmith Outreach Configuration:");
console.log("Endpoint:", process.env.LANGSMITH_ENDPOINT_OUTREACH);
console.log("Project:", OUTREACH_PROJECT_NAME);
console.log("API Key exists:", !!process.env.LANGSMITH_API_KEY_OUTREACH);

async function setupMonitoringDashboards() {
  try {
    console.log("Setting up Langsmith monitoring dashboards...");
    
    // Create or get project
    try {
      await client.readProject({ projectName: OUTREACH_PROJECT_NAME });
      console.log("Project exists:", OUTREACH_PROJECT_NAME);
    } catch (e) {
      console.log("Creating project:", OUTREACH_PROJECT_NAME);
      await client.createProject({ projectName: OUTREACH_PROJECT_NAME });
    }

    // Create test runs for different scenarios
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

    // Create a model instance
    const model = new ChatOpenAI({
      temperature: 0.7,
      modelName: "gpt-4",
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    // Run test scenarios
    for (const scenario of scenarios) {
      console.log(`Running test scenario: ${scenario.name}`);
      
      const prompt = PromptTemplate.fromTemplate(scenario.prompt);
      
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
              console.log(`Running ${scenario.name} with tracing enabled`);
            }
          }
        ],
        tags: ["test", "outreach", scenario.name.toLowerCase().replace(" ", "_")]
      });

      try {
        const result = await chain.call(
          scenario.vars,
          {
            tags: ["test-run", scenario.name.toLowerCase().replace(" ", "_")],
            metadata: { 
              scenarioName: scenario.name,
              projectName: OUTREACH_PROJECT_NAME,
              testType: "monitoring_setup"
            }
          }
        );

        console.log(`${scenario.name} completed:`, result);
      } catch (error) {
        console.error(`Error in ${scenario.name}:`, error);
      }
    }

    console.log("\nMonitoring setup completed!");
    console.log("\nNext steps:");
    console.log("1. Visit https://smith.langchain.com/");
    console.log(`2. Open the project: ${OUTREACH_PROJECT_NAME}`);
    console.log("3. Check the following in the Monitoring tab:");
    console.log("   - Response times");
    console.log("   - Token usage");
    console.log("   - Error rates");
    console.log("   - Scenario performance");
    
    return { success: true };
  } catch (error) {
    console.error("Setup failed:", error);
    return { success: false, error };
  }
}

// Run setup if file is executed directly
if (require.main === module) {
  setupMonitoringDashboards()
    .then((result) => {
      console.log("Setup execution completed:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Setup execution failed:", error);
      process.exit(1);
    });
} 