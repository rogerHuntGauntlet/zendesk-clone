export type Database = {
  public: {
    Tables: {
      zen_projects: {
        Row: {
          id: string
          name: string
          description: string | null
          admin_id: string
          employee_count: number
          client_count: number
          active_tickets: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          admin_id: string
          employee_count?: number
          client_count?: number
          active_tickets?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          admin_id?: string
          employee_count?: number
          client_count?: number
          active_tickets?: number
          created_at?: string
        }
      }
      zen_clients: {
        Row: {
          user_id: string
          company: string
          projects: string[]
          total_tickets: number
          active_tickets: number
          plan: string
          created_at: string
        }
        Insert: {
          user_id: string
          company: string
          projects?: string[]
          total_tickets?: number
          active_tickets?: number
          plan?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          company?: string
          projects?: string[]
          total_tickets?: number
          active_tickets?: number
          plan?: string
          created_at?: string
        }
      }
      zen_employees: {
        Row: {
          user_id: string
          department: string
          active_tickets: number
          specialties: string[]
          performance: any
          projects: string[]
          created_at: string
        }
        Insert: {
          user_id: string
          department: string
          active_tickets?: number
          specialties?: string[]
          performance?: any
          projects?: string[]
          created_at?: string
        }
        Update: {
          user_id?: string
          department?: string
          active_tickets?: number
          specialties?: string[]
          performance?: any
          projects?: string[]
          created_at?: string
        }
      }
      zen_tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high'
          category: string
          project_id: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          category: string
          project_id: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high'
          category?: string
          project_id?: string
          created_by?: string
          created_at?: string
        }
      }
    }
  }
}
