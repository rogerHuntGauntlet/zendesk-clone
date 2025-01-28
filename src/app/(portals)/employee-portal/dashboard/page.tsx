"use client";

import { useState } from 'react';
import { NewTicketModal } from '../../client-portal/components/ui/new-ticket-modal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmployeeDashboard() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const handleTicketSubmit = async (ticketData: any) => {
    // TODO: Implement ticket creation logic
    setIsTicketModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
          <Button onClick={() => setIsTicketModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Ticket
          </Button>
        </div>
        {/* Dashboard content will be implemented here */}
      </div>

      <NewTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        projectId="employee"
        onSubmit={handleTicketSubmit}
      />
    </div>
  );
} 