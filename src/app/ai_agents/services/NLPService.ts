import { AIServiceConfig } from './AIServiceConfig';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { OpenAIEmbeddings } from '@langchain/openai';

export class NLPService {
  private config: AIServiceConfig;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.config = AIServiceConfig.getInstance();
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'Analyze the sentiment of the following text. Respond with only "positive", "negative", or "neutral".\n\nText: {text}'
      ),
      this.config.getOpenAI(),
      new StringOutputParser()
    ]);

    const result = await chain.invoke({ text });
    return result.toLowerCase().trim() as 'positive' | 'negative' | 'neutral';
  }

  async extractKeywords(text: string): Promise<string[]> {
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'Extract the key topics and entities from the following text. Return them as a comma-separated list.\n\nText: {text}'
      ),
      this.config.getOpenAI(),
      new StringOutputParser()
    ]);

    const result = await chain.invoke({ text });
    return result.split(',').map(keyword => keyword.trim());
  }

  async generateResponse(context: string, query: string): Promise<string> {
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'Given the following context and query, generate a helpful and professional response.\n\nContext: {context}\n\nQuery: {query}\n\nResponse:'
      ),
      this.config.getOpenAI(),
      new StringOutputParser()
    ]);

    const result = await chain.invoke({ context, query });
    return result.trim();
  }

  async classifyIntent(text: string): Promise<string> {
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'Classify the intent of the following text into one of these categories: question, complaint, feedback, request, or appreciation.\n\nText: {text}'
      ),
      this.config.getOpenAI(),
      new StringOutputParser()
    ]);

    const result = await chain.invoke({ text });
    return result.toLowerCase().trim();
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embedding = await this.embeddings.embedQuery(text);
    return embedding;
  }

  async findSimilarDocuments(
    query: string,
    documents: Document[],
    topK: number = 3
  ): Promise<Document[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const documentEmbeddings = await Promise.all(
      documents.map(doc => this.generateEmbedding(doc.pageContent))
    );

    // Calculate cosine similarity
    const similarities = documentEmbeddings.map(docEmb => {
      return this.cosineSimilarity(queryEmbedding, docEmb);
    });

    // Get top K documents
    const topIndices = this.getTopKIndices(similarities, topK);
    return topIndices.map(index => documents[index]);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private getTopKIndices(arr: number[], k: number): number[] {
    return arr
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .slice(0, k)
      .map(item => item.idx);
  }
}
