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
    // Initialize LangSmith client with API key
    this.langSmithClient = new Client({
      apiKey: process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY,
    });

    // Set LangSmith environment variables
    if (typeof window !== 'undefined') {
      window.process = {
        ...window.process,
        env: {
          ...window.process?.env,
          NEXT_PUBLIC_LANGSMITH_ENDPOINT: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
          NEXT_PUBLIC_LANGSMITH_PROJECT: process.env.NEXT_PUBLIC_LANGSMITH_PROJECT || "pr-only-mountain-21",
          NEXT_PUBLIC_LANGSMITH_TRACING: 'true'
        }
      };
    }

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
      if (!process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY) {
        throw new Error('LangSmith API key is not configured. Please add NEXT_PUBLIC_LANGCHAIN_API_KEY to your environment variables.');
      }
      if (!process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT) {
        throw new Error('LangSmith endpoint is not configured. Please add NEXT_PUBLIC_LANGSMITH_ENDPOINT to your environment variables.');
      }
      if (!process.env.NEXT_PUBLIC_LANGSMITH_PROJECT) {
        throw new Error('LangSmith project is not configured. Please add NEXT_PUBLIC_LANGSMITH_PROJECT to your environment variables.');
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
