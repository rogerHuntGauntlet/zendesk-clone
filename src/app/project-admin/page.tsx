"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Plus, Users, Settings, ExternalLink, UserPlus, Building2, Trash2, Edit, Shield, Download, Upload, MoreVertical, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/auth-context';
import * as db from '@/lib/db';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  adminId: string;
  employeeCount: number;
  clientCount: number;
  activeTickets: number;
  status?: 'active' | 'archived';
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  permissions: string[];
  status: 'active' | 'pending';
}

interface DbTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending';
}

export default function ProjectAdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isManagingTeam, setIsManagingTeam] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [bulkEmails, setBulkEmails] = useState("");
  const [selectedRole, setSelectedRole] = useState("support_agent");
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const [isManagingClients, setIsManagingClients] = useState(false);
  const [clients, setClients] = useState<TeamMember[]>([]);
  const clientEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', user?.user_metadata?.role);
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      const isAdmin = user.user_metadata.role === 'project_admin';
      console.log('Is admin?', isAdmin);
      const projectsData = await db.getProjects(user.id, isAdmin);
      console.log('Projects data:', projectsData);
      
      // For project admins, show all projects (they can see everything)
      // For employees, show only projects they are assigned to (already filtered by getProjects)
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Only show create project button for admins
  const showCreateProject = user?.user_metadata.role === 'project_admin';
  console.log('Should show create button?', showCreateProject);

  const handleCreateProject = async () => {
    if (!user) return;
    
    try {
      const newProjectData = {
        name: newProject.name,
        description: newProject.description,
        created_at: new Date().toISOString(),
        admin_id: user.id,
        admin_email: user.email,
        admin_name: user.user_metadata?.name
      };
      
      const createdProject = await db.createProject(newProjectData);
      setProjects(prev => [...prev, createdProject]);
      setIsCreatingProject(false);
      setNewProject({ name: "", description: "" });
      
      toast({
        title: "Project Created",
        description: "Your new help desk project has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  function isValidStatus(status: string): status is 'active' | 'pending' {
    return status === 'active' || status === 'pending';
  }

  const handleManageTeam = async (project: Project) => {
    if (user?.user_metadata.role === 'project_admin') {
      setSelectedProject(project);
      setIsManagingTeam(true);
      try {
        const members = await db.getTeamMembers(project.id);
        setTeamMembers(members.map(member => {
          const status = isValidStatus(member.status) ? member.status : 'pending';
          return {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            status,
            permissions: [],
            department: undefined
          };
        }));
      } catch (error) {
        console.error('Error loading team members:', error);
        toast({
          title: "Error",
          description: "Failed to load team members. Please try again.",
          variant: "destructive",
        });
      }
    } else if (user?.user_metadata.role === 'employee') {
      router.push(`/employee-dashboard?projectId=${project.id}`);
    }
  };

  const handleInviteTeamMember = async () => {
    if (!selectedProject || !emailRef.current?.value) return;

    try {
      await db.addTeamMember(selectedProject.id, emailRef.current.value, selectedRole);
      // Refresh team members list
      const members = await db.getTeamMembers(selectedProject.id);
      setTeamMembers(members.map(member => {
        const status = isValidStatus(member.status) ? member.status : 'pending';
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          status,
          permissions: [],
          department: undefined
        };
      }));
      toast({
        title: "Invitation Sent",
        description: "Team member has been invited to join the project.",
      });
      emailRef.current.value = '';
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    // In a real app, this would call the API
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    toast({
      title: "Team Member Removed",
      description: "The team member has been removed from the project.",
    });
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;
    
    // In a real app, this would call the API
    setTeamMembers(prev => prev.map(m => 
      m.id === editingMember.id ? editingMember : m
    ));
    setEditingMember(null);
    toast({
      title: "Member Updated",
      description: "Team member details have been updated successfully.",
    });
  };

  const handleBulkInvite = async () => {
    if (!selectedProject) return;
    
    const emails = bulkEmails.split('\n').filter(email => email.trim());
    if (emails.length === 0) return;

    try {
      await Promise.all(
        emails.map(email => 
          db.addTeamMember(selectedProject.id, email.trim(), selectedRole)
        )
      );

      // Refresh team members list
      const members = await db.getTeamMembers(selectedProject.id);
      setTeamMembers(members.map(member => {
        const status = isValidStatus(member.status) ? member.status : 'pending';
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          status,
          permissions: [],
          department: undefined
        };
      }));

      toast({
        title: "Bulk Invitation Sent",
        description: `Invitations sent to ${emails.length} email addresses.`,
      });
      setBulkEmails("");
    } catch (error) {
      console.error('Error sending bulk invitations:', error);
      toast({
        title: "Error",
        description: "Failed to send some invitations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePermission = (permission: string) => {
    if (!editingMember) return;
    
    const updatedPermissions = editingMember.permissions.includes(permission)
      ? editingMember.permissions.filter(p => p !== permission)
      : [...editingMember.permissions, permission];
    
    setEditingMember({
      ...editingMember,
      permissions: updatedPermissions
    });
  };

  const navigateToProjectAdmin = (projectId: string) => {
    router.push(`/admin-dashboard?project=${projectId}`);
  };

  const openClientPortal = (projectId: string) => {
    router.push(`/client-dashboard?project=${projectId}`);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditingProject(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    try {
      // In a real app, this would be an API call
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id ? editingProject : p
      ));
      setIsEditingProject(false);
      setEditingProject(null);
      
      toast({
        title: "Project Updated",
        description: "Project details have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setIsDeletingProject(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      // In a real app, this would be an API call
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setIsDeletingProject(false);
      setProjectToDelete(null);
      
      toast({
        title: "Project Deleted",
        description: "The project has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveProject = async (project: Project) => {
    try {
      // In a real app, this would be an API call
      setProjects(prev => prev.map(p => 
        p.id === project.id 
          ? { ...p, status: p.status === 'archived' ? 'active' : 'archived' }
          : p
      ));
      
      toast({
        title: project.status === 'archived' ? "Project Restored" : "Project Archived",
        description: project.status === 'archived' 
          ? "The project has been restored to active status."
          : "The project has been archived.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageClients = async (project: Project) => {
    if (user?.user_metadata.role === 'project_admin') {
      setSelectedProject(project);
      setIsManagingClients(true);
      try {
        const members = await db.getTeamMembers(project.id);
        // Filter only client members
        setClients(members.filter(member => member.role === 'client').map(member => {
          const status = isValidStatus(member.status) ? member.status : 'pending';
          return {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            status,
            permissions: [],
            department: undefined
          };
        }));
      } catch (error) {
        console.error('Error loading clients:', error);
        toast({
          title: "Error",
          description: "Failed to load clients. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddClient = async () => {
    if (!selectedProject || !clientEmailRef.current?.value) return;

    try {
      await db.addTeamMember(selectedProject.id, clientEmailRef.current.value, 'client');
      // Refresh clients list
      const members = await db.getTeamMembers(selectedProject.id);
      setClients(members.filter(member => member.role === 'client').map(member => {
        const status = isValidStatus(member.status) ? member.status : 'pending';
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          status,
          permissions: [],
          department: undefined
        };
      }));
      toast({
        title: "Client Added",
        description: "Client has been added to the project.",
      });
      clientEmailRef.current.value = '';
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-white/80">
              {user?.user_metadata.role === 'project_admin' 
                ? 'Manage your help desk projects'
                : 'View your assigned projects'}
            </p>
          </div>
          {showCreateProject && (
            <Button 
              onClick={() => setIsCreatingProject(true)}
              className="bg-white hover:bg-white/90 text-purple-600"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Project
            </Button>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Building2 className="h-12 w-12 text-white/40 mb-4" />
              <CardTitle className="text-xl mb-2 text-white">No Projects Found</CardTitle>
              <CardDescription className="mb-6 text-white/80">
                {user?.user_metadata.role === 'project_admin' 
                  ? "Get started by creating your first project"
                  : "You haven't been added to any projects yet"}
              </CardDescription>
              {showCreateProject && (
                <Button 
                  onClick={() => setIsCreatingProject(true)}
                  className="bg-white hover:bg-white/90 text-purple-600"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Project
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className={`bg-white/10 backdrop-blur-md border-white/20 ${
                  project.status === 'archived' ? 'opacity-75' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {project.name}
                      {project.status === 'archived' && (
                        <Badge variant="secondary" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="ml-2">
                        {project.activeTickets} Active
                      </Badge>
                      {user?.user_metadata?.role === 'project_admin' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4 text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchiveProject(project)}>
                              <Archive className="mr-2 h-4 w-4" />
                              {project.status === 'archived' ? 'Restore' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProject(project)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription className="text-white/80">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sm text-white/60">Employees</p>
                      <p className="text-2xl font-bold text-white">{project.employeeCount}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-sm text-white/60">Clients</p>
                      <p className="text-2xl font-bold text-white">{project.clientCount}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {user?.user_metadata?.role === 'employee' ? (
                      <Button 
                        className="col-span-3 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push(`/employee-dashboard?projectId=${project.id}`)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Dashboard
                      </Button>
                    ) : user?.user_metadata?.role === 'client' ? (
                      <Button 
                        className="col-span-3 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push(`/client-dashboard?projectId=${project.id}`)}
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        View Client Dashboard
                      </Button>
                    ) : (
                      <>
                        {user?.user_metadata.role === 'project_admin' && (
                          <Button 
                            className="bg-white/20 hover:bg-white/30 text-white"
                            onClick={() => navigateToProjectAdmin(project.id)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Admin
                          </Button>
                        )}
                        <Button 
                          className="bg-indigo-500/50 hover:bg-indigo-500/70 text-white"
                          onClick={() => handleManageTeam(project)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Team
                        </Button>
                        <Button 
                          className="bg-emerald-500/50 hover:bg-emerald-500/70 text-white"
                          onClick={() => handleManageClients(project)}
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          Clients
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Project Dialog */}
        <Dialog open={isCreatingProject} onOpenChange={setIsCreatingProject}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new help desk project to manage your support team and clients.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team Management Dialog */}
        <Dialog open={isManagingTeam} onOpenChange={setIsManagingTeam}>
          <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Team Management - {selectedProject?.name}</DialogTitle>
              <DialogDescription>
                Manage team members and their roles in this project.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="invite">Invite</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Invite</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              <TabsContent value="members" className="space-y-4">
                {teamMembers.map(member => (
                  <Card key={member.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {member.name}
                        <div className="flex gap-2">
                          <Badge>{member.role}</Badge>
                          {member.status === 'pending' && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {member.status === 'active' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMember(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription>{member.email}</CardDescription>
                    </CardHeader>
                    {member.status === 'active' && (
                      <CardContent>
                        <p className="text-sm text-gray-500">Department: {member.department}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {member.permissions.map(permission => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="invite" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter team member's email"
                      ref={emailRef}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support_agent">Support Agent</SelectItem>
                        <SelectItem value="support_lead">Support Lead</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInviteTeamMember} className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invitation
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="bulk" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-emails">Email Addresses (one per line)</Label>
                    <Textarea
                      id="bulk-emails"
                      placeholder="Enter email addresses..."
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulk-role">Default Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support_agent">Support Agent</SelectItem>
                        <SelectItem value="support_lead">Support Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setBulkEmails("")} variant="outline">
                      Clear
                    </Button>
                    <Button onClick={handleBulkInvite} className="flex-1">
                      <Upload className="mr-2 h-4 w-4" />
                      Send Bulk Invitations
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Role Permissions</CardTitle>
                      <CardDescription>
                        Configure default permissions for each role
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Support Agent</Label>
                          <div className="mt-2 space-y-2">
                            <Badge variant="outline">View Tickets</Badge>
                            <Badge variant="outline">Reply to Tickets</Badge>
                            <Badge variant="outline">View Knowledge Base</Badge>
                          </div>
                        </div>
                        <div>
                          <Label>Support Lead</Label>
                          <div className="mt-2 space-y-2">
                            <Badge variant="outline">All Support Agent Permissions</Badge>
                            <Badge variant="outline">Manage Team</Badge>
                            <Badge variant="outline">View Analytics</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update team member details and permissions.
              </DialogDescription>
            </DialogHeader>
            {editingMember && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingMember.role}
                    onValueChange={(value) => setEditingMember({
                      ...editingMember,
                      role: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Support Agent">Support Agent</SelectItem>
                      <SelectItem value="Support Lead">Support Lead</SelectItem>
                      <SelectItem value="Project Manager">Project Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["view_tickets", "reply_to_tickets", "view_knowledge_base", "manage_team", "view_analytics"].map(permission => (
                      <Badge
                        key={permission}
                        variant={editingMember.permissions.includes(permission) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTogglePermission(permission)}
                      >
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingMember(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update project details and settings.
              </DialogDescription>
            </DialogHeader>
            {editingProject && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input
                    id="edit-name"
                    value={editingProject.name}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingProject.description}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      description: e.target.value
                    })}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeletingProject} onOpenChange={setIsDeletingProject}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeletingProject(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteProject}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Client Management Dialog */}
        <Dialog open={isManagingClients} onOpenChange={setIsManagingClients}>
          <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Client Management - {selectedProject?.name}</DialogTitle>
              <DialogDescription>
                Manage clients for this project.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="clients" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="add">Add Client</TabsTrigger>
              </TabsList>
              <TabsContent value="clients" className="space-y-4">
                {clients.map(client => (
                  <Card key={client.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {client.name}
                        <div className="flex gap-2">
                          <Badge>Client</Badge>
                          {client.status === 'pending' && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {client.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(client.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription>{client.email}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="add" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client-email">Client Email Address</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="Enter client's email"
                      ref={clientEmailRef}
                    />
                  </div>
                  <Button onClick={handleAddClient} className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 