"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChatButton } from "./components/ui/chat-button";

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Props {
  children: React.ReactNode;
  projects: Project[];
}

export default function ClientPortalLayout({
  children,
  projects,
}: Props) {
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const pathname = usePathname();

  useEffect(() => {
    // Extract project ID from pathname if we're on a specific project page
    const projectMatch = pathname.match(/\/projects\/([^\/]+)/);
    if (projectMatch) {
      setCurrentProjectId(projectMatch[1]);
    } else {
      setCurrentProjectId(undefined);
    }
  }, [pathname]);

  return (
    <>
      {children}
      <ChatButton 
        projectId={currentProjectId} 
        projects={!currentProjectId ? projects : undefined} 
      />
    </>
  );
}