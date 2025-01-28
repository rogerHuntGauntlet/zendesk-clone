import { AIServiceConfig } from './AIServiceConfig';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';

export class ResearchService {
  private config: AIServiceConfig;

  constructor() {
    this.config = AIServiceConfig.getInstance();
  }

  async conductWebResearch(query: string): Promise<Document[]> {
    const tavily = this.config.getTavily();
    const results = await tavily.getRelevantDocuments(query);
    return results;
  }

  async analyzeCompany(companyName: string): Promise<any> {
    try {
      // First, gather information using Tavily
      const searchQueries = [
        `${companyName} company overview`,
        `${companyName} recent news`,
        `${companyName} competitors`,
        `${companyName} market position`
      ];

      const searchResults = await Promise.all(
        searchQueries.map(query => this.conductWebResearch(query))
      );

      // Create a new OpenAI instance with JSON response format
      const jsonOpenAI = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0.7,
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        maxTokens: 1000
      });

      // Combine and summarize the search results first
      const searchInfo = searchResults.flat()
        .map(doc => doc.pageContent)
        .join('\n')
        .slice(0, 4000); // Limit the input size

      // First, get a concise summary
      const summaryChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(
          'Summarize the key information about {company} from the following text in 2-3 sentences:\n\n{info}'
        ),
        jsonOpenAI,
        new StringOutputParser()
      ]);

      const summary = await summaryChain.invoke({
        company: companyName || 'Unknown Company',
        info: searchInfo
      });

      // Then analyze the summary
      const analysisChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(
          'Based on this summary about {company}, provide a structured analysis in JSON format.\n\n' +
          'Summary: {summary}\n\n' +
          'Additional Context: {info}\n\n' +
          'Return a JSON object with these fields (use "Information not available" for unknown values):\n' +
          '- overview: Company summary\n' +
          '- recent_developments: Latest news\n' +
          '- market_position: Market standing\n' +
          '- competitors: Key competitors\n' +
          '- technology: Array of tech stack\n' +
          '- size: Company size\n' +
          '- industry: Primary industry'
        ),
        jsonOpenAI,
        new StringOutputParser()
      ]);

      const analysis = await analysisChain.invoke({
        company: companyName || 'Unknown Company',
        summary,
        info: searchInfo.slice(0, 2000) // Further limit context for analysis
      });

      try {
        return JSON.parse(analysis);
      } catch (error) {
        console.error('Error parsing company analysis:', error);
        return {
          overview: 'Information not available',
          recent_developments: 'Information not available',
          market_position: 'Information not available',
          competitors: 'Information not available',
          technology: [],
          size: 'Information not available',
          industry: 'Information not available'
        };
      }
    } catch (error) {
      console.error('Error in analyzeCompany:', error);
      return {
        overview: 'Error occurred',
        recent_developments: 'Error occurred',
        market_position: 'Error occurred',
        competitors: 'Error occurred',
        technology: [],
        size: 'Error occurred',
        industry: 'Error occurred'
      };
    }
  }

  async analyzePerson(name: string, email: string, company: string): Promise<any> {
    try {
      const searchQueries = [
        `${name} ${company} professional background`,
        `${name} ${company} role position`,
        `${name} ${company} achievements`
      ];

      const searchResults = await Promise.all(
        searchQueries.map(query => this.conductWebResearch(query))
      );

      const jsonOpenAI = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0.7,
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        maxTokens: 1000
      });

      // Combine and limit search results
      const searchInfo = searchResults.flat()
        .map(doc => doc.pageContent)
        .join('\n')
        .slice(0, 4000);

      // Get a concise summary first
      const summaryChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(
          'Summarize the key professional information about {name} from {company} in 2-3 sentences:\n\n{info}'
        ),
        jsonOpenAI,
        new StringOutputParser()
      ]);

      const summary = await summaryChain.invoke({
        name: name || 'Unknown Person',
        company: company || 'Unknown Company',
        info: searchInfo
      });

      // Then analyze the summary
      const analysisChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(
          'Based on this summary about {name} from {company}, provide a structured analysis.\n\n' +
          'Summary: {summary}\n\n' +
          'Additional Context: {info}\n\n' +
          'Return a JSON object with these fields:\n' +
          '- role: Current position (string)\n' +
          '- background: Experience (string)\n' +
          '- interests: Array of interests\n' +
          '- pain_points: Array of challenges\n\n' +
          'Use "Information not available" for unknown string values and empty arrays for unknown arrays.'
        ),
        jsonOpenAI,
        new StringOutputParser()
      ]);

      const analysis = await analysisChain.invoke({
        name: name || 'Unknown Person',
        company: company || 'Unknown Company',
        summary,
        info: searchInfo.slice(0, 2000)
      });

      try {
        return JSON.parse(analysis);
      } catch (error) {
        console.error('Error parsing person analysis:', error);
        return {
          role: 'Information not available',
          background: 'Information not available',
          interests: [],
          pain_points: []
        };
      }
    } catch (error) {
      console.error('Error in analyzePerson:', error);
      return {
        role: 'Error occurred',
        background: 'Error occurred',
        interests: [],
        pain_points: []
      };
    }
  }

  async findRelevantDocumentation(query: string, context?: string): Promise<Document[]> {
    // First, search internal documentation using Pinecone
    const pinecone = this.config.getPinecone();
    // TODO: Implement Pinecone index querying

    // Then, supplement with web research if needed
    const webResults = await this.conductWebResearch(query);

    // Combine and rank results
    return webResults; // Placeholder until Pinecone implementation
  }

  async summarizeFindings(documents: Document[]): Promise<string> {
    const analysisChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'Summarize the key findings from the following research documents. ' +
        'Focus on the most important and actionable information.\n\nDocuments: {documents}'
      ),
      this.config.getOpenAI(),
      new StringOutputParser()
    ]);

    const result = await analysisChain.invoke({
      documents: documents.map(doc => doc.pageContent).join('\n\n')
    });

    return result;
  }

  async identifyActionItems(content: string): Promise<string[]> {
    const actionItemChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'Extract specific, actionable items from the following content. ' +
        'Return them as a numbered list.\n\nContent: {content}'
      ),
      this.config.getOpenAI(),
      new StringOutputParser()
    ]);

    const result = await actionItemChain.invoke({ content });
    return result
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
  }

  async generateInsights(data: any): Promise<any> {
    const insightChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'Analyze the following data and generate key insights, trends, and recommendations.\n\n' +
        'Data: {data}\n\n' +
        'Provide your analysis in the following format:\n' +
        '- Key Insights:\n' +
        '- Trends:\n' +
        '- Recommendations:'
      ),
      this.config.getOpenAI(),
      new StringOutputParser()
    ]);

    const result = await insightChain.invoke({
      data: JSON.stringify(data, null, 2)
    });

    return this.parseInsights(result);
  }

  private parseInsights(text: string): any {
    const sections = text.split('\n\n');
    const insights: any = {};
    
    sections.forEach(section => {
      const [title, ...items] = section.split('\n');
      const key = title.replace(':', '').trim().toLowerCase().replace(/\s+/g, '_');
      insights[key] = items
        .map(item => item.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    });

    return insights;
  }
}
