export interface Team {
  id: string;
  name: string;
  description: string;
  focusArea: string;
  teamLead: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
} 