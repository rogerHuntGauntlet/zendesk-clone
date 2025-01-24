'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';

interface AssignTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketId: string, userId: string) => Promise<void>;
  ticket: {
    id: string;
    title: string;
    assigned_to: string | null;
  };
  members: Array<{
    user_id: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export default function AssignTicketModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  ticket, 
  members 
}: AssignTicketModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(ticket.assigned_to || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(ticket.id, selectedMemberId);
      onClose();
    } catch (error) {
      console.error('Error in AssignTicketModal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container for centering */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-white/10">
          <Dialog.Title className="text-xl font-semibold text-white mb-4">
            Assign Ticket
          </Dialog.Title>

          <div className="mb-4">
            <h3 className="text-white font-medium">{ticket.title}</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="member" className="block text-sm font-medium text-white/80 mb-1">
                Assign to Team Member
              </label>
              <select
                id="member"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select a team member</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.name} ({member.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedMemberId}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Assigning...' : 'Assign Ticket'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 