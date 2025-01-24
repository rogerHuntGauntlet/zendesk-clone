import { useState } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { useUser } from '@supabase/auth-helpers-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SharedNotes from './SharedNotes';
import TicketTimeline from './TicketTimeline';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
}

const tabOptions = [
  { id: 'details', label: 'Details' },
  { id: 'history', label: 'History' },
  { id: 'team-notes', label: 'Team Notes' }
];

export default function ProjectDetailModal({ isOpen, onClose, project }: ProjectDetailModalProps) {
  const user = useUser();
  const [activeTab, setActiveTab] = useState(tabOptions[0].id);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        
        <Dialog.Panel className="relative bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-none p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold text-white">
                {project.title}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-none border-b border-white/10">
            <Tab.Group selectedIndex={tabOptions.findIndex(t => t.id === activeTab)} onChange={(index) => setActiveTab(tabOptions[index].id)}>
              <Tab.List className="flex gap-4 px-6">
                {tabOptions.map(tab => (
                  <Tab
                    key={tab.id}
                    className={({ selected }) => `py-3 text-sm font-medium border-b-2 ${
                      selected ? 'text-violet-400 border-violet-400' : 'text-white/60 border-transparent hover:text-white/80 hover:border-white/20'
                    }`}
                  >
                    {tab.label}
                  </Tab>
                ))}
              </Tab.List>
            </Tab.Group>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0">
            {activeTab === 'details' ? (
              <div className="p-6">
                {/* Existing details content */}
                <div className="prose prose-invert">
                  <h3 className="text-lg font-medium">Description</h3>
                  <p className="mt-2 text-white/80">{project.description}</p>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white">Status</h3>
                  <p className="mt-2 text-white/80">{project.status}</p>
                </div>
              </div>
            ) : activeTab === 'history' ? (
              <TicketTimeline
                isOpen={activeTab === 'history'}
                onClose={() => setActiveTab('details')}
                ticket={project}
              />
            ) : (
              <SharedNotes
                projectId={project.id}
                currentUser={{
                  id: user?.id || '',
                  email: user?.email || '',
                  role: user?.user_metadata?.role || ''
                }}
              />
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 