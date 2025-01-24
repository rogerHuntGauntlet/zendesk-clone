"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { ChevronLeft, Plus, MessageCircle } from "lucide-react";

interface ProjectHeaderProps {
  title: string;
  projectId?: string;
  onSignOut: () => void;
  userEmail: string;
}

export function ProjectHeader({ title, projectId, onSignOut, userEmail }: ProjectHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="mr-2 text-green-700 hover:text-green-800 hover:bg-green-50"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-green-900">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            {projectId && (
              <>
                <Button
                  onClick={() => router.push(`/client-portal/projects/${projectId}/new-ticket`)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Ticket
                </Button>
                <Button
                  onClick={() => router.push(`/client-portal/chat?project=${projectId}`)}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Live Chat
                </Button>
              </>
            )}
            <div className="flex items-center gap-4">
              <span className="text-sm text-green-600">{userEmail}</span>
              <Button
                onClick={onSignOut}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 