import { SupabaseClient } from '@supabase/supabase-js';

export class AgentFactory {
  private static instance: AgentFactory;
  private supabase: SupabaseClient;

  private constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public static getInstance(supabase: SupabaseClient): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory(supabase);
    }
    return AgentFactory.instance;
  }

  public async getExistingAgent(agentId: string) {
    const { data: agent, error } = await this.supabase
      .from('zen_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      throw new Error('Agent not found');
    }

    return {
      id: agent.id,
      execute: async (action: string, params: any) => {
        // Log the action
        await this.supabase
          .from('zen_agent_actions')
          .insert({
            agent_id: agent.id,
            action,
            params,
            status: 'pending'
          });

        // In a real implementation, this would trigger the agent's action
        // For now, we'll just return a success response
        return { success: true };
      }
    };
  }
} 