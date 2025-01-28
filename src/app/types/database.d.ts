export interface Database {
  public: {
    Tables: {
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
      // ... other tables
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