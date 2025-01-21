export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'client';
  avatar?: string;
  department?: string;
  title?: string;
  phone?: string;
  timezone?: string;
  lastActive?: string;
  joinedDate: string;
} 