import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/database';
import { BaseAgent } from './BaseAgent';
import { TicketAgent } from '../agents/TicketAgent';
import { KnowledgeAgent } from '../agents/KnowledgeAgent';
import { SupportAgent } from '../agents/SupportAgent';
import { BizDevAgent } from '../agents/BizDevAgent';
import { ResearchAgent } from '../agents/ResearchAgent';
import { ProjectManagementAgent } from '../agents/ProjectManagementAgent';

export type AgentType = 'ticket' | 'knowledge' | 'support' | 'bizdev' | 'research' | 'project';

export class AgentFactory {
  private static instance: AgentFactory;
  private supabaseClient: SupabaseClient<Database>;

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabaseClient = supabaseClient;
  }

  public static getInstance(supabaseClient: SupabaseClient<Database>): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory(supabaseClient);
    }
    // Always update the supabase client to ensure it's the latest instance
    AgentFactory.instance.supabaseClient = supabaseClient;
    return AgentFactory.instance;
  }

  private async ensureAgentInUsers(agentId: string, name: string, email: string): Promise<void> {
    // Check if agent exists in zen_users
    const { data: existingUser, error: selectError } = await this.supabaseClient
      .from('zen_users')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking for agent user:', selectError);
      throw new Error('Failed to check for agent user');
    }

    if (!existingUser) {
      // Create agent user if doesn't exist
      const { error: insertError } = await this.supabaseClient
        .from('zen_users')
        .insert({
          id: agentId,
          email: email,
          name: name,
          role: 'admin',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating agent user:', insertError);
        throw new Error('Failed to create agent user');
      }
    }
  }

  public async getExistingAgent(agentId: string): Promise<BaseAgent> {
    const { data: agent, error } = await this.supabaseClient
      .from('zen_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      throw new Error('Agent not found');
    }

    // Ensure agent exists in zen_users table
    await this.ensureAgentInUsers(agent.id, agent.name, agent.email);

    switch (agent.role) {
      case 'ticket':
        return new TicketAgent(this.supabaseClient, agent.id);
      case 'knowledge':
        return new KnowledgeAgent(this.supabaseClient, agent.id);
      case 'support':
        return new SupportAgent(this.supabaseClient, agent.id);
      case 'bizdev':
        return new BizDevAgent(this.supabaseClient, agent.id);
      case 'research':
        return new ResearchAgent(this.supabaseClient, agent.id);
      case 'project':
        return new ProjectManagementAgent(this.supabaseClient, agent.id);
      default:
        throw new Error(`Agent type ${agent.role} not implemented`);
    }
  }

  public async createAgent(type: AgentType): Promise<BaseAgent> {
    // Create a new agent record in the database
    const { data: agentData, error } = await this.supabaseClient
      .from('zen_agents')
      .insert({
        name: `${type}_agent`,
        role: type,
        email: `${type}_agent@system.internal`,
      })
      .select()
      .single();

    if (error) throw error;

    // Ensure agent exists in zen_users table
    await this.ensureAgentInUsers(
      agentData.id,
      agentData.name,
      agentData.email
    );

    // Return the appropriate agent instance
    switch (type) {
      case 'ticket':
        return new TicketAgent(this.supabaseClient, agentData.id);
      case 'knowledge':
        return new KnowledgeAgent(this.supabaseClient, agentData.id);
      case 'support':
        return new SupportAgent(this.supabaseClient, agentData.id);
      case 'bizdev':
        return new BizDevAgent(this.supabaseClient, agentData.id);
      case 'research':
        return new ResearchAgent(this.supabaseClient, agentData.id);
      case 'project':
        return new ProjectManagementAgent(this.supabaseClient, agentData.id);
      default:
        throw new Error(`Agent type ${type} not implemented`);
    }
  }
}
