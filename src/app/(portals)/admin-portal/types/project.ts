export interface Project {
  id: string;
  name: string;
  description: string;
  ticketCount: number;
  active_tickets: number;
  status: "active" | "completed" | "on-hold";
  created_by: string;
  clientCount: number;
  employeeCount: number;
  createdAt: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  totalTickets: number;
  activeTickets: number;
  totalClients: number;
  totalEmployees: number;
} 