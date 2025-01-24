import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import TicketTimeline from "../../../admin-portal/components/ui/project-detail/TicketTimeline";

export default async function TicketDetail({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });

  // Get ticket details
  const { data: ticket, error } = await supabase
    .from('zen_tickets')
    .select(`
      *,
      project:project_id (
        id,
        name
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !ticket) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-violet-700 text-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold">{ticket.title}</h1>
          <div className="mt-1 flex items-center gap-x-4 text-sm text-violet-100">
            <span>Project: {ticket.project.name}</span>
            <span>•</span>
            <span>Status: {ticket.status}</span>
            <span>•</span>
            <span>Priority: {ticket.priority}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm min-h-[600px] flex flex-col">
          {/* Original ticket description */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Timeline interface */}
          <div className="flex-1">
            <TicketTimeline 
              isOpen={true}
              onClose={() => {}}
              ticket={{
                id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 