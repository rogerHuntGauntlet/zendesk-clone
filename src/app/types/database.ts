export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          has_access: boolean | null
          access_type: string | null
          access_granted_at: string | null
          access_expires_at: string | null
          promotion_code: string | null
          wallet_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          has_access?: boolean | null
          access_type?: string | null
          access_granted_at?: string | null
          access_expires_at?: string | null
          promotion_code?: string | null
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          has_access?: boolean | null
          access_type?: string | null
          access_granted_at?: string | null
          access_expires_at?: string | null
          promotion_code?: string | null
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      zen_agents: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          department: string | null
          title: string | null
          created_at: string
          updated_at: string
          metadata: Record<string, any> | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: string
          department?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Record<string, any> | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          department?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Record<string, any> | null
          is_active?: boolean | null
        }
      }
      zen_projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          metadata?: Record<string, any> | null
        }
      }
      zen_tickets: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: string
          priority: string | null
          category: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          due_date: string | null
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status: string
          priority?: string | null
          category?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          due_date?: string | null
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string | null
          category?: string | null
          assigned_to?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          due_date?: string | null
          metadata?: Record<string, any> | null
        }
      }
      zen_ticket_activities: {
        Row: {
          id: string
          ticket_id: string | null
          activity_type: string
          content: string | null
          media_url: string | null
          metadata: Record<string, any> | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          activity_type: string
          content?: string | null
          media_url?: string | null
          metadata?: Record<string, any> | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string | null
          activity_type?: string
          content?: string | null
          media_url?: string | null
          metadata?: Record<string, any> | null
          created_by?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
