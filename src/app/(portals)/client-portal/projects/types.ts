export type ProjectMember = {
  user_id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type ProjectMemberBasic = {
  project_id: string;
};

export type Project = {
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

export type ProjectWithStats = Project & {
  memberCount: number;
  ticketCount: number;
}; 