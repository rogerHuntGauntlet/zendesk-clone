import { BaseAgent } from '../core/BaseAgent';
import { Database } from '../types/database';
import { SupabaseClient } from '@supabase/supabase-js';

interface ArticleCreationParams {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

interface ArticleUpdateParams {
  articleId: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

interface SearchParams {
  query: string;
  category?: string;
}

export class KnowledgeAgent extends BaseAgent {
  constructor(supabaseClient: SupabaseClient<Database>, agentId: string) {
    super(supabaseClient, agentId);
  }

  async execute(
    action: 'create' | 'update' | 'search' | 'suggest',
    params: ArticleCreationParams | ArticleUpdateParams | SearchParams
  ): Promise<any> {
    await this.validateAccess();

    switch (action) {
      case 'create':
        return this.createArticle(params as ArticleCreationParams);
      case 'update':
        return this.updateArticle(params as ArticleUpdateParams);
      case 'search':
        return this.searchKnowledgeBase(params as SearchParams);
      case 'suggest':
        return this.suggestArticles(params as SearchParams);
      default:
        throw new Error('Invalid action specified');
    }
  }

  private async createArticle(params: ArticleCreationParams): Promise<any> {
    const { data, error } = await this.client
      .from('zen_knowledge_articles')
      .insert({
        title: params.title,
        content: params.content,
        category: params.category,
        tags: params.tags,
        created_by: this.agentId,
        status: 'published'
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAction('CREATE_ARTICLE', {
      articleId: data.id,
      params
    });

    return data;
  }

  private async updateArticle(params: ArticleUpdateParams): Promise<any> {
    const { articleId, ...updateData } = params;
    
    const { data, error } = await this.client
      .from('zen_knowledge_articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
      .single();

    if (error) throw error;

    await this.logAction('UPDATE_ARTICLE', {
      articleId,
      updates: updateData
    });

    return data;
  }

  private async searchKnowledgeBase(params: SearchParams): Promise<any> {
    // Here you would implement full-text search
    // This is a simplified version
    const query = this.client
      .from('zen_knowledge_articles')
      .select('*')
      .textSearch('title', params.query, {
        type: 'websearch',
        config: 'english'
      });

    if (params.category) {
      query.eq('category', params.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    await this.logAction('SEARCH_KNOWLEDGE_BASE', {
      query: params.query,
      resultsCount: data?.length
    });

    return data;
  }

  private async suggestArticles(params: SearchParams): Promise<any> {
    // First, get relevant articles
    const articles = await this.searchKnowledgeBase(params);

    // Here you would implement AI-based article suggestion logic
    // For example, ranking articles based on relevance, popularity, etc.
    const suggestedArticles = articles.map(article => ({
      ...article,
      relevanceScore: this.calculateRelevance(article, params.query),
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    await this.logAction('SUGGEST_ARTICLES', {
      query: params.query,
      suggestedCount: suggestedArticles.length
    });

    return suggestedArticles;
  }

  private calculateRelevance(article: any, query: string): number {
    // Implement relevance calculation logic
    // This is a placeholder implementation
    const titleMatch = article.title.toLowerCase().includes(query.toLowerCase());
    const contentMatch = article.content.toLowerCase().includes(query.toLowerCase());
    
    return (titleMatch ? 2 : 0) + (contentMatch ? 1 : 0);
  }
}
