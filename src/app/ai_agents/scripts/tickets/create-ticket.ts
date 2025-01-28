import { getServiceClient, handleDatabaseError, validateEnvironment } from '../../utils/supabase';
import { validateTicket } from '../../utils/validation';
import { ZenTicket } from '../../types/database';

export async function createTicket(ticketData: Partial<ZenTicket>) {
  try {
    // Validate environment
    validateEnvironment();

    // Validate ticket data
    const errors = validateTicket(ticketData);
    if (errors.length > 0) {
      console.error('Ticket validation failed:');
      errors.forEach(error => console.error(`- ${error}`));
      throw new Error('Invalid ticket data');
    }

    // Get database client
    const supabase = getServiceClient();

    // Create ticket
    console.log('Creating ticket:', ticketData.title);
    const { data: ticket, error: ticketError } = await supabase
      .from('zen_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      handleDatabaseError(ticketError, 'ticket creation');
    }

    // Create activity log
    const { error: activityError } = await supabase
      .from('zen_activities')
      .insert({
        type: 'ticket_created',
        user_id: ticketData.created_by,
        project_id: ticketData.project_id,
        description: `Ticket created: ${ticketData.title}`
      });

    if (activityError) {
      console.warn('Failed to create activity log:', activityError);
      // Don't throw error for activity log failure
    }

    console.log('Ticket created successfully:', ticket.id);
    return ticket;

  } catch (error: any) {
    handleDatabaseError(error, 'createTicket');
    throw error;
  }
}

// Example usage:
/*
import { createTicket } from './create-ticket';

const ticketData = {
  title: 'Unity VR Integration Issues',
  description: 'Need assistance with VR controller input mapping...',
  status: 'open' as const,
  priority: 'high' as const,
  category: 'Technical',
  project_id: 'project-id',
  created_by: 'user-id'
};

createTicket(ticketData)
  .then(ticket => console.log('Created ticket:', ticket))
  .catch(error => console.error('Failed to create ticket:', error));
*/
