"use client";

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
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
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
          .select('project_id')
          .eq('user_id', user.id)
          .eq('role', 'employee'),
        supabase
          .from('zen_pending_invites')
          .select('*')
          .eq('email', user.email || '')
          .eq('status', 'pending')
          .neq('role', 'client')
      ]);

      console.log('Member query:', {
        userId: user.id,
        email: user.email,
        memberError,
        inviteError
      });

      if (memberError) throw memberError;
      if (inviteError) throw inviteError;

      console.log('Project members:', projectMembers);
      console.log('Pending invites:', pendingInvites);

      // Combine project IDs from both memberships and invites
      const memberProjectIds = (projectMembers || []).map(pm => pm.project_id);
      const inviteProjectIds = (pendingInvites || []).map(invite => invite.project_id);
      const allProjectIds = Array.from(new Set([...memberProjectIds, ...inviteProjectIds]));

      console.log('All project IDs:', allProjectIds);

      if (!allProjectIds.length) {
        console.log('No projects found for user');
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // Get project details
      const { data: projectsData, error: projectsError } = await supabase
        .from('zen_projects')
        .select(`
          id,
          name,
          description,
          created_at,
          active_tickets,
          admin:zen_users!zen_projects_admin_id_fkey (
            name,
            email
          )
        `)
        .in('id', allProjectIds || []);

      console.log('Projects data:', projectsData);
      console.log('Projects error:', projectsError);

      if (projectsError) throw projectsError;

      // Transform the data to match the Project interface
      const transformedProjects = (projectsData || []).map(project => {
        // Handle the admin data which comes as an array from the join
        const adminData = Array.isArray(project.admin) ? project.admin[0] : project.admin;
        return {
          ...project,
          admin: {
            name: adminData?.name || 'Unknown',
            email: adminData?.email || 'unknown@email.com'
          },
          // Set status based on whether the project is in memberProjectIds
          status: memberProjectIds.includes(project.id) ? 'active' : 'pending'
        };
      }) as Project[];

      console.log('Transformed projects:', transformedProjects);
      setProjects(transformedProjects);
      setFilteredProjects(transformedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Search and filter
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "created_at") {
        return sortOrder === "asc"
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    setFilteredProjects(filtered);
  }, [projects, searchQuery, sortField, sortOrder]);

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
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field as typeof sortField);
              setSortOrder(order as typeof sortOrder);
            }}
            className="px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50 backdrop-blur-sm"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="active_tickets-desc">Most Active Tickets</option>
            <option value="active_tickets-asc">Least Active Tickets</option>
          </select>
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
                      {project.status === 'pending' && (
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