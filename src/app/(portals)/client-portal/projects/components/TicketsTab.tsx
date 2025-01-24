"use client";

import { Project } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface TicketsTabProps {
  projects: Project[];
  searchQuery: string;
  sortField: keyof Project;
  sortOrder: "asc" | "desc";
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSortFieldChange: (value: string) => void;
  onSortOrderChange: () => void;
  onAcceptInvite: (projectId: string) => void;
  getProjectStatus: (project: Project) => string;
  getStatusColor: (status: string) => string;
}

export function TicketsTab({
  projects,
  searchQuery,
  sortField,
  sortOrder,
  onSearchChange,
  onSortFieldChange,
  onSortOrderChange,
  onAcceptInvite,
  getProjectStatus,
  getStatusColor
}: TicketsTabProps) {
  const router = useRouter();

  return (
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
            onChange={onSearchChange}
            className="max-w-xs border-green-200 focus:ring-green-500 focus:border-green-500"
          />
          <Select value={sortField} onValueChange={onSortFieldChange}>
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
            onClick={onSortOrderChange}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
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
                      variant={project.status === 'pending' ? 'secondary' : 'default'} 
                      className={project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : getStatusColor(status)}
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
                    <div className="mt-6">
                      <Button
                        onClick={() => onAcceptInvite(project.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Accept Invite
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
  );
} 