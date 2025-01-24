export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: 'active' | 'on-hold' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_id: string;
} 