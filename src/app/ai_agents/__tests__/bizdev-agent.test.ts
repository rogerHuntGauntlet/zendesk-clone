import { createClient } from '@supabase/supabase-js';
import { AgentFactory } from '../core/AgentFactory';
import type { Database } from '../../types/database';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testBizDevAgent() {
  console.log('Starting BizDev Agent test...');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variables for Supabase');
  }

  // Initialize Supabase client
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Verify Supabase connection
    const { data: testQuery, error: testError } = await supabase
      .from('zen_projects')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Failed to connect to Supabase:', testError);
      throw testError;
    }
    console.log('Successfully connected to Supabase');

    // Get or create test admin user
    console.log('Getting or creating test admin user...');
    const testAdminEmail = 'test.admin@example.com';
    
    let { data: admin, error: adminQueryError } = await supabase
      .from('zen_users')
      .select('*')
      .eq('email', testAdminEmail)
      .single();

    if (!admin) {
      const { data: newAdmin, error: adminError } = await supabase
        .from('zen_users')
        .insert({
          name: 'Test Admin',
          email: testAdminEmail,
          role: 'admin'
        })
        .select()
        .single();

      if (adminError) throw adminError;
      admin = newAdmin;
    }
    
    console.log('Using admin:', admin.id);

    // Create a test project
    console.log('Creating test project...');
    const { data: project, error: projectError } = await supabase
      .from('zen_projects')
      .insert({
        name: 'Test Outreach Campaign',
        description: 'Testing our BizDev agent',
        admin_id: admin.id,
        employee_count: 0,
        client_count: 0,
        active_tickets: 0
      })
      .select()
      .single();

    if (projectError) throw projectError;
    console.log('Project created:', project.id);

    // Add test prospects
    const prospects = [
      {
        name: 'Satya Nadella',
        email: 'satya@microsoft.com',
        company: 'Microsoft'
      },
      {
        name: 'Tim Cook',
        email: 'tim@apple.com',
        company: 'Apple'
      }
    ];

    console.log('Adding test prospects...');
    for (const prospect of prospects) {
      // Create a client user first
      const { data: clientUser, error: clientUserError } = await supabase
        .from('zen_users')
        .insert({
          name: prospect.name,
          email: prospect.email,
          role: 'client'
        })
        .select()
        .single();

      if (clientUserError && clientUserError.code !== '23505') throw clientUserError;

      // Get the client user if it already exists
      let user = clientUser;
      if (!user) {
        const { data: existingUser } = await supabase
          .from('zen_users')
          .select('*')
          .eq('email', prospect.email)
          .single();
        user = existingUser;
      }

      // Create or update the client record
      const { data: client, error: clientError } = await supabase
        .from('zen_clients')
        .upsert({
          user_id: user.id,
          company: prospect.company,
          total_tickets: 0,
          active_tickets: 0,
          plan: 'prospect'
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Add client as project member
      const { error: memberError } = await supabase
        .from('zen_project_members')
        .upsert({
          project_id: project.id,
          user_id: user.id,
          role: 'client'
        });

      if (memberError) throw memberError;

      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('zen_tickets')
        .insert({
          project_id: project.id,
          title: `Prospect: ${prospect.name}`,
          description: `Prospect from ${prospect.company}\nEmail: ${prospect.email}`,
          status: 'new',
          priority: 'medium',
          category: {
            type: 'prospect',
            data: prospect
          },
          created_by: admin.id,
          client: user.id,
          tags: ['prospect', prospect.company.toLowerCase()]
        })
        .select()
        .single();

      if (ticketError) throw ticketError;
      console.log('Added prospect ticket:', ticket.id);
    }

    // Get or create BizDev agent
    console.log('Getting or creating BizDev agent...');
    const factory = AgentFactory.getInstance(supabase);
    
    // First try to get existing agent
    let bizDevAgent;
    try {
      const { data: existingAgent } = await supabase
        .from('zen_agents')
        .select('*')
        .eq('email', 'bizdev_agent@system.internal')
        .single();
      
      if (existingAgent) {
        console.log('Using existing BizDev agent:', existingAgent.id);
        bizDevAgent = await factory.getExistingAgent(existingAgent.id);
      } else {
        console.log('Creating new BizDev agent...');
        bizDevAgent = await factory.createAgent('bizdev');
      }
    } catch (error) {
      console.log('Error getting existing agent, creating new one...');
      bizDevAgent = await factory.createAgent('bizdev');
    }

    // Test prospect research
    console.log('Testing prospect research...');
    const researchResults = await bizDevAgent.execute('research_prospects', {
      projectId: project.id
    });
    console.log('Research results:', JSON.stringify(researchResults, null, 2));

    // Test outreach generation for each researched prospect
    console.log('Testing outreach generation...');
    for (const result of researchResults) {
      const outreach = await bizDevAgent.execute('generate_outreach', {
        ticketId: result.id,
        messageType: 'initial'
      });
      console.log('Generated outreach for ticket:', result.id);
      console.log('Outreach message:', outreach.content);
    }

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    throw error;  // Re-throw to see the full error
  }
}

// Run the test
testBizDevAgent();
