'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';

interface TicketTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    zen_ticket_summaries?: Array<{
      id: string;
      summary: string;
      created_at: string;
      created_by: string;
      created_by_role: string;
    }>;
    zen_ticket_activities?: Array<{
      id: string;
      activity_type: string;
      content: string | null;
      media_url: string | null;
      created_at: string;
      metadata: any;
    }>;
    zen_ticket_messages?: Array<{
      id: string;
      content: string;
      source: string;
      created_at: string;
      created_by: string;
      media_url: string | null;
      metadata: any;
    }>;
  };
}

export default function TicketTimeline({ isOpen, onClose, ticket }: TicketTimelineProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'messages'>('timeline');

  const allItems = [
    ...(ticket.zen_ticket_summaries || []).map(summary => ({
      type: 'summary',
      id: summary.id,
      content: summary.summary,
      created_at: summary.created_at,
      created_by: summary.created_by,
      created_by_role: summary.created_by_role,
    })),
    ...(ticket.zen_ticket_activities || []).map(activity => ({
      type: 'activity',
      id: activity.id,
      content: activity.content,
      media_url: activity.media_url,
      created_at: activity.created_at,
      activity_type: activity.activity_type,
    })),
    ...(ticket.zen_ticket_messages || []).map(message => ({
      type: 'message',
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      created_by: message.created_by,
      media_url: message.media_url,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Dialog.Title className="text-lg font-medium text-green-800">
                    {ticket.title}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-green-600">Status: {ticket.status}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-green-400 hover:text-green-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex space-x-4 border-b border-green-100">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'timeline'
                        ? 'border-b-2 border-green-500 text-green-600'
                        : 'text-green-500 hover:text-green-600'
                    }`}
                    onClick={() => setActiveTab('timeline')}
                  >
                    Timeline
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'messages'
                        ? 'border-b-2 border-green-500 text-green-600'
                        : 'text-green-500 hover:text-green-600'
                    }`}
                    onClick={() => setActiveTab('messages')}
                  >
                    Messages
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {activeTab === 'timeline' ? (
                  <div className="space-y-4">
                    {allItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 rounded-lg bg-green-50"
                      >
                        <div className="flex-1">
                          <div className="text-sm text-green-800">{item.content}</div>
                          <div className="mt-1 text-xs text-green-600">
                            {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        {item.media_url && (
                          <a
                            href={item.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                          >
                            View Attachment
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ticket.zen_ticket_messages?.map((message) => (
                      <div
                        key={message.id}
                        className="flex gap-4 p-4 rounded-lg bg-green-50"
                      >
                        <div className="flex-1">
                          <div className="text-sm text-green-800">{message.content}</div>
                          <div className="mt-1 text-xs text-green-600">
                            {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        {message.media_url && (
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                          >
                            View Attachment
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
