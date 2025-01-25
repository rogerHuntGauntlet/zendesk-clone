'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(portals)/client-portal/hooks/useAuth";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart, Wallet, MessageCircle, HelpCircle } from "lucide-react";
import { ChatButton } from "@/app/(portals)/client-portal/components/ui/chat-button";

type ProjectMember = {
  user_id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type ProjectMemberBasic = {
  project_id: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  active_tickets: number;
  members: ProjectMember[];
  admin: {
    name: string;
    email: string;
  }[];
  status: 'pending' | 'active';
};

type ProjectWithStats = Project & {
  memberCount: number;
  ticketCount: number;
};

export default function ClientProjectsContent() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Project>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching projects for user:', user?.email);
      
      // Step 1: Get project IDs for the user where they are a client or have pending invites
      const [
        { data: projectMembers, error: memberError },
        { data: pendingInvites, error: inviteError }
      ] = await Promise.all([
        supabase
          .from('zen_project_members')
          .select('project_id')
          .eq('user_id', user?.id)
          .eq('role', 'client'),
        supabase
          .from('zen_pending_invites')
          .select('project_id')
          .eq('email', user?.email)
          .eq('status', 'pending')
          .eq('role', 'client')
      ]);

      if (memberError) throw memberError;
      if (inviteError) throw inviteError;

      console.log('Client project members:', projectMembers);
      console.log('Pending invites:', pendingInvites);

      // Combine project IDs from both active memberships and pending invites
      const allProjectIds = [
        ...(projectMembers?.map(pm => pm.project_id) || []),
        ...(pendingInvites?.map(pi => pi.project_id) || [])
      ];

      if (allProjectIds.length === 0) {
        setProjects([]);
        setFilteredProjects([]);
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch full project details
      const { data: projectsData, error: projectsError } = await supabase
        .from('zen_projects')
        .select(`
          id,
          name,
          description,
          created_at,
          active_tickets,
          members:zen_project_members(
            user_id,
            role,
            user:zen_users(
              id,
              name,
              email
            )
          ),
          admin:zen_project_members(
            user:zen_users(
              name,
              email
            )
          )
        `)
        .in('id', allProjectIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Step 3: Process and format the projects data
      const processedProjects = projectsData.map(project => ({
        ...project,
        status: pendingInvites?.some(pi => pi.project_id === project.id)
          ? 'pending'
          : 'active'
      }));

      console.log('Processed projects:', processedProjects);

      setProjects(processedProjects);
      setFilteredProjects(processedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects. Please try again later.');
      toast.error('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort projects whenever search query or sort parameters change
  useEffect(() => {
    let result = [...projects];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
        ? (aValue as any) - (bValue as any)
        : (bValue as any) - (aValue as any);
    });

    setFilteredProjects(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, sortField, sortOrder, projects]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSortChange = (field: keyof Project) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/client-portal/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
        <p className="text-gray-600">
          View and manage all your projects in one place
        </p>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={sortField}
            onValueChange={(value) => handleSortChange(value as keyof Project)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="active_tickets">Active Tickets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() => handleSortChange(sortField)}
          className="w-full md:w-auto"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : currentProjects.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">
            {searchQuery
              ? "No projects match your search criteria"
              : "You haven't been added to any projects yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentProjects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={project.status === 'pending' ? 'outline' : 'default'}
                      className="ml-2"
                    >
                      {project.status === 'pending' ? 'Pending' : 'Active'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Created</span>
                      <span>{format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Active Tickets</span>
                      <span>{project.active_tickets}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Team Size</span>
                      <span>{project.members.length} members</span>
                    </div>
                    {project.admin && project.admin[0] && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Admin</span>
                        <span>{project.admin[0].user.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {project.status === 'active' && (
                    <div className="mt-6 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/client-portal/projects/${project.id}/tickets`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Tickets
                      </Button>
                      <ChatButton projectId={project.id} className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </ChatButton>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
