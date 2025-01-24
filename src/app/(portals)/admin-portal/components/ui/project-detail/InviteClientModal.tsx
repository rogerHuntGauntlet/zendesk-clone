'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, company: string) => Promise<void>;
}

export default function InviteClientModal({ isOpen, onClose, onSubmit }: InviteClientModalProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email, company);
      setEmail('');
      setCompany('');
      onClose();
    } catch (error) {
      console.error('Error in InviteClientModal:', error);
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
            Invite Client
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Enter client's email address"
                required
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-white/80 mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Enter company name"
                required
              />
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
                disabled={loading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Inviting...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 