'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';

interface Member {
  id: string;
  name: string;
  email: string;
  projects: {
    id: string;
    name: string;
  }[];
}

interface AssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  members: Member[];
  type: 'clients' | 'employees';
}

export default function AssignmentsModal({ isOpen, onClose, title, members, type }: AssignmentsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Dialog.Panel className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
            {title}
          </Dialog.Title>

          {/* Search input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Members list */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No {type} found
              </p>
            ) : (
              filteredMembers.map(member => (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                      {member.projects.length} project{member.projects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {member.projects.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Assigned Projects:</p>
                      <div className="flex flex-wrap gap-2">
                        {member.projects.map(project => (
                          <span
                            key={project.id}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                          >
                            {project.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 