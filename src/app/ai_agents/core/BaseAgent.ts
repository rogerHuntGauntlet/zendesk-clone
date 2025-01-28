import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

export abstract class BaseAgent {
  protected client: SupabaseClient<Database>;
  protected agentId: string;

  constructor(supabaseClient: SupabaseClient<Database>, agentId: string) {
    this.client = supabaseClient;
    this.agentId = agentId;
  }

  protected async logAction(action: string, details: Record<string, any>): Promise<void> {
    try {
      await this.client.from('zen_activities').insert({
        user_id: this.agentId,
        type: 'AI_AGENT_ACTION',
        description: action,
        metadata: details,
      });
    } catch (error) {
      console.error('Failed to log agent action:', error);
    }
  }

  protected async validateAccess(): Promise<boolean> {
    const { data, error } = await this.client
      .from('zen_agents')
      .select('is_active')
      .eq('id', this.agentId)
      .single();

    if (error || !data) {
      throw new Error('Agent validation failed');
    }

    return data.is_active;
  }

  abstract execute(...args: any[]): Promise<any>;
}
