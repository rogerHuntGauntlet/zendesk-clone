"use client";

import { useState } from 'react';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { Button } from './button';
import { ChatModal } from './chat-modal';

interface ChatButtonProps {
  projectId?: string;
  projects?: {
    id: string;
    name: string;
    description: string;
  }[];
}

export function ChatButton({ projectId, projects }: ChatButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't render the button if we're not on a project page and have no projects
  if (!projectId && (!projects || projects.length === 0)) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-green-600 hover:bg-green-500 animate-float"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1">
            <div className="bg-blue-500 rounded-full p-1">
              <HelpCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        </Button>
      </div>

      <ChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        projects={projects}
        portal="client-portal"
      />

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
