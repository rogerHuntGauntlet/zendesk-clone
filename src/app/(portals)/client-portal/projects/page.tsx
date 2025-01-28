"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { createClient } from "../lib/supabase";
import { format } from "date-fns";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Input } from "../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { LineChart, BarChart, Wallet, MessageCircle, HelpCircle } from "lucide-react";
import { ChatButton } from "../components/ui/chat-button"; // Import ChatButton component

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

export default function ClientProjects() {
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
  const supabase = createClient();

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

      // Combine project IDs from both memberships and invites
      const memberProjectIds = (projectMembers as ProjectMemberBasic[] || []).map(pm => pm.project_id);
      const inviteProjectIds = (pendingInvites || []).map(invite => invite.project_id);
      const allProjectIds = Array.from(new Set([...memberProjectIds, ...inviteProjectIds]));

      console.log('All project IDs:', allProjectIds);
      console.log('Member project IDs:', memberProjectIds);
      console.log('Invite project IDs:', inviteProjectIds);

      if (allProjectIds.length === 0) {
        console.log('No client projects or invites found for user');
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // Step 2: Get basic project info
      const { data: basicProjects, error: basicError } = await supabase
        .from('zen_projects')
        .select(`
          id,
          name,
          description,
          created_at,
          active_tickets,
          admin_id
        `)
        .in('id', allProjectIds);

      if (basicError) throw basicError;

      if (!basicProjects) {
        throw new Error('No projects data received');
      }

      // Map projects with their status (pending vs active)
      const projectsWithStatus = basicProjects.map(project => ({
        ...project,
        status: memberProjectIds.includes(project.id) ? 'active' : 'pending'
      }));

      console.log('Projects with status:', projectsWithStatus);

      // Step 3: Get project members for these projects
      const { data: members, error: membersError } = await supabase
        .from('zen_project_members')
        .select(`
          project_id,
          user_id,
          role,
          user:zen_users!zen_project_members_user_id_fkey(
            id,
            name,
            email
          )
        `)
        .in('project_id', allProjectIds);

      if (membersError) throw membersError;

      // Step 4: Get admin info
      const adminIds = projectsWithStatus.map(p => p.admin_id).filter(id => id);
      const { data: admins, error: adminsError } = await supabase
        .from('zen_users')
        .select('id, name, email')
        .in('id', adminIds);

      if (adminsError) throw adminsError;

      // Step 5: Get pending invites status for each project
      const { data: projectInvites, error: projectInvitesError } = await supabase
        .from('zen_pending_invites')
        .select('project_id, status')
        .eq('email', user?.email)
        .eq('role', 'client')
        .eq('status', 'pending');

      if (projectInvitesError) throw projectInvitesError;

      // Step 6: Combine all the data
      const transformedProjects = projectsWithStatus.map(project => {
        const projectMembers = members?.filter(m => m.project_id === project.id) || [];
        const admin = admins?.find(a => a.id === project.admin_id);
        
        return {
          ...project,
          members: projectMembers.map(member => ({
            user_id: member.user_id,
            role: member.role,
            user: Array.isArray(member.user) ? member.user[0] : member.user
          })) as ProjectMember[],
          admin: admin ? [{ name: admin.name, email: admin.email }] : []
        } as Project;
      });

      console.log('Transformed projects:', transformedProjects);
      setProjects(transformedProjects);
      
    } catch (err) {
      console.error('Error in fetchProjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Search and filter
  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    setFilteredProjects(sorted);
    setCurrentPage(1); // Reset to first page when filtering/sorting
  }, [searchQuery, sortField, sortOrder, projects]);

  const getProjectStatus = (project: Project) => {
    if (project.active_tickets === 0) return "inactive";
    if (project.active_tickets > 5) return "high";
    return "active";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high": return "destructive";
      case "active": return "success";
      case "inactive": return "secondary";
      default: return "secondary";
    }
  };

  // Pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortFieldChange = (value: string) => {
    setSortField(value as keyof Project);
  };

  const handleAcceptInvite = async (projectId: string) => {
    try {
      console.log('Starting invite acceptance process for project:', projectId);
      
      // Get the pending invite
      const { data: invite, error: inviteError } = await supabase
        .from('zen_pending_invites')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', user?.email)
        .eq('status', 'pending')
        .single();

      console.log('Found pending invite:', invite);
      if (inviteError) throw inviteError;

      // Check if user exists in zen_users
      const { data: existingUser, error: userCheckError } = await supabase
        .from('zen_users')
        .select('*')
        .eq('id', user?.id)
        .single();

      console.log('Existing user check:', { existingUser, userCheckError });

      // Create user if doesn't exist
      if (!existingUser) {
        console.log('Creating new user entry');
        const { error: userError } = await supabase
          .from('zen_users')
          .insert({
            id: user?.id,
            email: user?.email,
            name: user?.email?.split('@')[0] || 'New User',
            role: 'client'
          });

        if (userError) {
          console.error('Error creating user:', userError);
          throw userError;
        }
        console.log('Created new user entry');
      }

      // Now check for client entry
      const { data: existingClient, error: clientCheckError } = await supabase
        .from('zen_clients')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      console.log('Existing client check:', { existingClient, clientCheckError });

      // Create client entry if doesn't exist
      if (!existingClient) {
        console.log('Creating new client entry for user:', user?.id);
        const { error: clientError } = await supabase
          .from('zen_clients')
          .insert({
            user_id: user?.id,
            company: 'Default Company',
            plan: 'standard'
          });

        if (clientError) {
          console.error('Error creating client:', clientError);
          throw clientError;
        }
        console.log('Created new client entry');
      }

      // Check if already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('zen_project_members')
        .select('*')
        .eq('user_id', user?.id)
        .eq('project_id', projectId)
        .single();

      console.log('Existing member check:', { existingMember, memberCheckError });

      if (existingMember) {
        console.log('User is already a member of this project');
        toast.error('You are already a member of this project');
        return;
      }

      // Create project member entry
      console.log('Creating project member entry');
      const { error: memberError } = await supabase
        .from('zen_project_members')
        .insert({
          user_id: user?.id,
          project_id: projectId,
          role: 'client'
        });

      if (memberError) {
        console.error('Error creating member:', memberError);
        throw memberError;
      }
      console.log('Created project member entry');

      // Update invite status to accepted
      console.log('Updating invite status to accepted');
      const { error: updateError } = await supabase
        .from('zen_pending_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Error updating invite:', updateError);
        throw updateError;
      }
      console.log('Updated invite status');

      toast.success('Invite accepted successfully');
      setProjects([]); // Clear current projects
      await fetchProjects(); // Refresh the projects list
      window.location.reload(); // Force a complete page refresh
    } catch (error) {
      console.error('Detailed error in accepting invite:', error);
      toast.error('Failed to accept invite');
    }
  };

  const handleRejectInvite = async (projectId: string) => {
    try {
      console.log('Starting invite rejection process for project:', projectId);
      
      // Get the pending invite
      const { data: invite, error: inviteError } = await supabase
        .from('zen_pending_invites')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', user?.email)
        .eq('status', 'pending')
        .single();

      console.log('Found pending invite:', invite);
      if (inviteError) throw inviteError;

      // Update invite status to rejected
      console.log('Updating invite status to rejected');
      const { error: updateError } = await supabase
        .from('zen_pending_invites')
        .update({ status: 'rejected' })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Error updating invite:', updateError);
        throw updateError;
      }
      console.log('Updated invite status');

      toast.success('Invite rejected');
      setProjects([]); // Clear current projects
      await fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error('Detailed error in rejecting invite:', error);
      toast.error('Failed to reject invite');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <nav className="bg-green-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">My Projects</h1>
            </div>
            <div className="flex items-center">
              <span className="text-green-100 mr-4">{user.email}</span>
              <Button
                onClick={() => signOut()}
                variant="ghost"
                className="text-green-100 hover:text-white hover:bg-green-600"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg mb-6 p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-sm border-green-600 text-green-700">Client Portal</Badge>
            <span className="text-green-600">•</span>
            <span className="text-sm text-green-700">Logged in as {user.email}</span>
          </div>
          
          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="help">Help & Support</TabsTrigger>
            </TabsList>

            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle>Active Tickets</CardTitle>
                  <CardDescription>View and manage your support tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <Input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="max-w-xs border-green-200 focus:ring-green-500 focus:border-green-500"
                    />
                    <Select value={sortField} onValueChange={handleSortFieldChange}>
                      <SelectTrigger className="max-w-xs border-green-200">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Date Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="active_tickets">Active Tickets</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      variant="outline"
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </Button>
                  </div>

                  {/* Projects Grid */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {currentProjects.map((project) => {
                      const status = project.status === 'pending' ? 'pending' : getProjectStatus(project);
                      return (
                        <div
                          key={project.id}
                          className={`bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow border border-green-100 ${
                            project.status === 'pending' ? 'opacity-90' : ''
                          }`}
                        >
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-medium text-green-900 truncate">
                                {project.name}
                              </h3>
                              <Badge 
                                variant={project.status === 'pending' ? 'secondary' : getStatusColor(status)} 
                                className={project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              >
                                {project.status === 'pending' ? 'Pending Invite' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-green-600 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Active Tickets</span>
                                <span className="font-medium text-green-800">{project.active_tickets}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Team Size</span>
                                <span className="font-medium text-green-800">{project.members.length} members</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Created</span>
                                <span className="font-medium text-green-800">
                                  {format(new Date(project.created_at), "MMM d, yyyy")}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">Project Admin</span>
                                <span className="font-medium text-green-800">{project.admin[0]?.name}</span>
                              </div>
                            </div>
                            {project.status === 'pending' ? (
                              <div className="mt-6 space-y-2">
                                <Button
                                  onClick={() => handleAcceptInvite(project.id)}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Accept Invite
                                </Button>
                                <Button
                                  onClick={() => handleRejectInvite(project.id)}
                                  variant="outline"
                                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  Reject Invite
                                </Button>
                              </div>
                            ) : (
                              <div className="mt-6">
                                <Button
                                  onClick={() => router.push(`/client-portal/projects/${project.id}`)}
                                  className="w-full border-green-200 text-green-700 hover:bg-green-50"
                                  variant="outline"
                                >
                                  View Project
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick-actions">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
                    onClick={() => router.push('/client-portal/new-ticket')}
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-2xl">➕</span>
                      <div>
                        <div className="font-medium">Create New Ticket</div>
                        <div className="text-sm text-green-600">Submit a new support request</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
                    onClick={() => router.push('/client-portal/knowledge-base')}
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-2xl">📚</span>
                      <div>
                        <div className="font-medium">Knowledge Base</div>
                        <div className="text-sm text-green-600">Browse help articles and guides</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-2xl">📅</span>
                      <div>
                        <div className="font-medium">Schedule Meeting</div>
                        <div className="text-sm text-green-600">Book time with support team</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-2xl">📊</span>
                      <div>
                        <div className="font-medium">Generate Report</div>
                        <div className="text-sm text-green-600">Download activity summary</div>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Overview</CardTitle>
                  <CardDescription>Track your support metrics and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <LineChart className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Response Time</h4>
                      </div>
                      <div className="text-2xl font-semibold text-green-900">2.4 hrs</div>
                      <div className="text-sm text-green-600">Avg. first response</div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Resolution Rate</h4>
                      </div>
                      <div className="text-2xl font-semibold text-green-900">94%</div>
                      <div className="text-sm text-green-600">Within SLA</div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Active Tickets</h4>
                      </div>
                      <div className="text-2xl font-semibold text-green-900">12</div>
                      <div className="text-sm text-green-600">Currently open</div>
                    </div>
                  </div>

                  {/* Placeholder for charts */}
                  <div className="space-y-6">
                    <div className="h-64 bg-green-50 rounded-lg flex items-center justify-center">
                      <p className="text-green-600">Ticket Volume Trend</p>
                    </div>
                    <div className="h-64 bg-green-50 rounded-lg flex items-center justify-center">
                      <p className="text-green-600">Resolution Time Distribution</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="help">
              <Card>
                <CardHeader>
                  <CardTitle>Help & Support Resources</CardTitle>
                  <CardDescription>Get assistance and learn more about our platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h4 className="text-lg font-medium text-green-800 mb-4">Documentation</h4>
                      <div className="space-y-4">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">📖</span>
                          User Guide
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">🎥</span>
                          Video Tutorials
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">❓</span>
                          FAQs
                        </Button>
                      </div>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                      <h4 className="text-lg font-medium text-green-800 mb-4">Contact Support</h4>
                      <div className="space-y-4">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">💬</span>
                          Live Chat
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">📞</span>
                          Schedule a Call
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">📧</span>
                          Email Support
                        </Button>
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-green-50 p-6 rounded-lg">
                      <h4 className="text-lg font-medium text-green-800 mb-4">Training & Onboarding</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">🎓</span>
                          Get Started Guide
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">👥</span>
                          Book Training Session
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <span className="mr-2">📱</span>
                          Mobile App Guide
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ChatButton projects={filteredProjects} /> // Add ChatButton component

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 