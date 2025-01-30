import { ChatOpenAI } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
import { Client } from "langsmith";

export class AIServiceConfig {
  private static instance: AIServiceConfig;
  private openAIModel: ChatOpenAI;
  private pineconeClient: Pinecone;
  private tavilyRetriever: TavilySearchAPIRetriever;
  private langSmithClient: Client;

  private constructor() {
    // Set up LangSmith environment variables first
    if (typeof window === 'undefined') {
      // Server-side environment setup
      process.env.LANGSMITH_TRACING = "true";
      process.env.LANGSMITH_ENDPOINT = "https://api.smith.langchain.com";
      process.env.LANGSMITH_PROJECT = "zendesk-clone-test";
      
      // Also set LangChain variables for compatibility
      process.env.LANGCHAIN_TRACING_V2 = "true";
      process.env.LANGCHAIN_ENDPOINT = "https://api.smith.langchain.com";
      process.env.LANGCHAIN_PROJECT = "zendesk-clone-test";
    }

    // Initialize LangSmith client with outreach-specific key
    const langSmithApiKey = process.env.LANGSMITH_API_KEY_OUTREACH || 
                           process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH ||
                           process.env.LANGSMITH_API_KEY ||
                           process.env.LANGCHAIN_API_KEY;

    if (!langSmithApiKey) {
      throw new Error('LangSmith API key is not configured. Please add LANGSMITH_API_KEY_OUTREACH to your environment variables.');
    }

    // Set up LangSmith client
    this.langSmithClient = new Client({
      apiKey: langSmithApiKey,
      apiUrl: process.env.LANGSMITH_ENDPOINT_OUTREACH || "https://api.smith.langchain.com"
    });

    // Set project name for tracing
    process.env.LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT_OUTREACH || "outreach-crm-ai";

    // Initialize OpenAI with tracing enabled
    this.openAIModel = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: "https://api.openai.com/v1",
      }
    });

    // Initialize Pinecone
    this.pineconeClient = new Pinecone({
      apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
    });

    // Initialize Tavily
    this.tavilyRetriever = new TavilySearchAPIRetriever({
      apiKey: process.env.NEXT_PUBLIC_TAVILY_API_KEY!,
    });
  }

  public static getInstance(): AIServiceConfig {
    if (!AIServiceConfig.instance) {
      if (!process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
        throw new Error('Pinecone API key is not configured. Please add NEXT_PUBLIC_PINECONE_API_KEY to your environment variables.');
      }
      AIServiceConfig.instance = new AIServiceConfig();
    }
    return AIServiceConfig.instance;
  }

  public getOpenAI(): ChatOpenAI {
    return this.openAIModel;
  }

  public getPinecone(): Pinecone {
    return this.pineconeClient;
  }

  public getTavily(): TavilySearchAPIRetriever {
    return this.tavilyRetriever;
  }

  public getLangSmithClient(): Client {
    return this.langSmithClient;
  }
}
