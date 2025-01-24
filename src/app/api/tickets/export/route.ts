import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { ticketIds } = await request.json();

    // Verify user has access to these tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('zen_tickets')
      .select(`
        *,
        project:project_id (
          name
        ),
        zen_ticket_messages (
          id,
          content,
          source,
          created_at,
          created_by,
          media_url,
          metadata
        ),
        zen_ticket_activities (
          id,
          activity_type,
          content,
          created_at,
          media_url,
          metadata
        ),
        zen_ticket_summaries (
          id,
          summary,
          created_at,
          created_by,
          created_by_role
        )
      `)
      .in('id', ticketIds);

    if (ticketsError) throw ticketsError;
    if (!tickets.length) {
      return NextResponse.json(
        { error: 'No tickets found' },
        { status: 404 }
      );
    }

    // Create zip file
    const zip = new JSZip();

    // Process each ticket
    tickets.forEach((ticket) => {
      const ticketFolder = zip.folder(`ticket_${ticket.id}`);
      if (!ticketFolder) return;

      // Add ticket details
      ticketFolder.file('ticket_info.json', JSON.stringify({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        project_name: ticket.project?.name
      }, null, 2));

      // Add messages
      if (ticket.zen_ticket_messages?.length) {
        ticketFolder.file('messages.json', JSON.stringify(
          ticket.zen_ticket_messages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
          null, 2
        ));
      }

      // Add activities
      if (ticket.zen_ticket_activities?.length) {
        ticketFolder.file('activities.json', JSON.stringify(
          ticket.zen_ticket_activities.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
          null, 2
        ));
      }

      // Add summaries
      if (ticket.zen_ticket_summaries?.length) {
        ticketFolder.file('summaries.json', JSON.stringify(
          ticket.zen_ticket_summaries.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
          null, 2
        ));
      }
    });

    // Generate zip file
    const zipContent = await zip.generateAsync({ type: 'blob' });
    const arrayBuffer = await zipContent.arrayBuffer();

    // Return the zip file
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=ticket_export_${new Date().toISOString().split('T')[0]}.zip`
      }
    });

  } catch (error) {
    console.error('Error exporting tickets:', error);
    return NextResponse.json(
      { error: 'Failed to export tickets' },
      { status: 500 }
    );
  }
} 