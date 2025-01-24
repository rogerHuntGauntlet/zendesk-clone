import { Project } from "./types";

export const getProjectStatus = (project: Project) => {
  if (project.active_tickets === 0) return "inactive";
  if (project.active_tickets > 5) return "high";
  return "active";
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "high": return "destructive";
    case "active": return "success";
    case "inactive": return "secondary";
    default: return "secondary";
  }
}; 