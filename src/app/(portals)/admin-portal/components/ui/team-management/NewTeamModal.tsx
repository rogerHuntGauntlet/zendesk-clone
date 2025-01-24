"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface NewTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (teamData: {
    name: string;
    description: string;
    focusArea: string;
    teamLeadId: string;
  }) => void;
}

export default function NewTeamModal({ isOpen, onClose, onSubmit }: NewTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    focusArea: '',
    teamLeadId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', description: '', focusArea: '', teamLeadId: '' });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="relative transform rounded-lg bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full sm:mt-0">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-white mb-6">
                    Create New Team
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-white">
                        Team Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        placeholder="e.g. Frontend Support Team"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-white">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        placeholder="Describe the team's responsibilities"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="focusArea" className="block text-sm font-medium text-white">
                        Focus Area
                      </label>
                      <input
                        type="text"
                        id="focusArea"
                        value={formData.focusArea}
                        onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        placeholder="e.g. Frontend Development"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="teamLead" className="block text-sm font-medium text-white">
                        Team Lead
                      </label>
                      <select
                        id="teamLead"
                        value={formData.teamLeadId}
                        onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        required
                      >
                        <option value="">Select a team lead</option>
                        {/* We'll populate this with actual team leads */}
                        <option value="1">John Smith</option>
                        <option value="2">Jane Doe</option>
                      </select>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        Create Team
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 