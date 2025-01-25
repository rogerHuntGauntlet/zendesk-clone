"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  active_tickets: number;
  admin: {
    name: string;
    email: string;
  };
}

export default function EmployeeProjects() {
  const router = useRouter();
  const { getCurrentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "created_at" | "active_tickets">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const supabase = createClientComponentClient();
    try {
      const user = await getCurrentUser();
      console.log('Current user:', user);
      
      if (!user) {
        router.push("/employee-portal/login");
        return;
      }

      // Get both active memberships and pending invites
      const [
        { data: projectMembers, error: memberError },
        { data: pendingInvites, error: inviteError }
      ] = await Promise.all([
        supabase
          .from('zen_project_members')
          .select(`
            project_id,
            role,
            zen_projects (
              id,
              name,
              description,
              created_at,
              status,
              active_tickets,
              admin:zen_users!admin_id (
                name:full_name,
                email
              )
            )
          `)
          .eq('user_id', user.id),
        supabase
          .from('zen_project_invites')
          .select(`
            project_id,
            zen_projects (
              id,
              name,
              description,
              created_at,
              status,
              active_tickets,
              admin:zen_users!admin_id (
                name:full_name,
                email
              )
            )
          `)
          .eq('email', user.email)
          .eq('status', 'pending')
      ]);

      if (memberError) throw memberError;
      if (inviteError) throw inviteError;

      // Combine and format projects from both sources
      const activeProjects = (projectMembers || [])
        .map(member => member.zen_projects)
        .filter(project => project !== null);

      const pendingProjects = (pendingInvites || [])
        .map(invite => ({
          ...invite.zen_projects,
          isPending: true
        }))
        .filter(project => project !== null);

      const allProjects = [...activeProjects, ...pendingProjects];
      setProjects(allProjects);
      setFilteredProjects(allProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort projects when search query or sort parameters change
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "active_tickets":
          comparison = a.active_tickets - b.active_tickets;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredProjects(filtered);
  }, [searchQuery, sortField, sortOrder, projects]);

  const getProjectStatus = (activeTickets: number) => {
    if (activeTickets === 0) return "inactive";
    if (activeTickets > 5) return "high";
    return "active";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-orange-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-orange-100 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">View and manage your assigned projects</p>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50 backdrop-blur-sm"
          />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as "name" | "created_at" | "active_tickets")}
            className="px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50 backdrop-blur-sm"
          >
            <option value="created_at">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="active_tickets">Sort by Active Tickets</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50 backdrop-blur-sm"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-lg border border-orange-200">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">You haven't been assigned to any projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/employee-portal/projects/${project.id}`}
                className="block bg-white/50 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all border border-orange-200 hover:border-orange-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{project.name}</h3>
                      {'isPending' in project && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Pending Invitation
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getProjectStatus(project.active_tickets) === "high"
                          ? "bg-red-100 text-red-800"
                          : getProjectStatus(project.active_tickets) === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.active_tickets} active tickets
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Admin: {project.admin.name}</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}