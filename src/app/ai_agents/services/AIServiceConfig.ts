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
    if (typeof window !== 'undefined') {
      // Client-side environment setup
      window.process = {
        ...window.process,
        env: {
          ...window.process?.env,
          LANGSMITH_TRACING: "true",
          LANGSMITH_ENDPOINT: "https://api.smith.langchain.com",
          LANGSMITH_API_KEY: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY,
          LANGSMITH_PROJECT: "default"
        }
      };
    } else {
      // Server-side environment setup
      process.env.LANGSMITH_TRACING = "true";
      process.env.LANGSMITH_ENDPOINT = "https://api.smith.langchain.com";
      process.env.LANGSMITH_API_KEY = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;
      process.env.LANGSMITH_PROJECT = "default";
    }

    // Initialize LangSmith client
    this.langSmithClient = new Client({
      apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY,
    });

    // Initialize OpenAI with tracing enabled
    this.openAIModel = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
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
      if (!process.env.NEXT_PUBLIC_LANGSMITH_API_KEY) {
        throw new Error('LangSmith API key is not configured. Please add NEXT_PUBLIC_LANGSMITH_API_KEY to your environment variables.');
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
