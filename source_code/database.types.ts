export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client: Json
          created_at: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          items: Json
          notes: string | null
          payment_terms: string | null
          provider: Json
          status: string | null
          subtotal: number
          tax: Json | null
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client: Json
          created_at?: string | null
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          items: Json
          notes?: string | null
          payment_terms?: string | null
          provider: Json
          status?: string | null
          subtotal: number
          tax?: Json | null
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client?: Json
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          payment_terms?: string | null
          provider?: Json
          status?: string | null
          subtotal?: number
          tax?: Json | null
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          created_at: string | null
          estimated_duration: string | null
          id: string
          job_id: string
          proposal: string
          proposed_rate: number | null
          provider_id: string
          provider_marked_done: boolean | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          job_id: string
          proposal: string
          proposed_rate?: number | null
          provider_id: string
          provider_marked_done?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          job_id?: string
          proposal?: string
          proposed_rate?: number | null
          provider_id?: string
          provider_marked_done?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number
          attachments: string[] | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string
          category: string
          client_id: string
          created_at: string
          description: string
          experience_level: string | null
          id: string
          is_featured: boolean
          location_preference: string | null
          project_duration: string | null
          skills_required: string[] | null
          status: string
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          applications_count?: number
          attachments?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string
          category: string
          client_id: string
          created_at?: string
          description: string
          experience_level?: string | null
          id?: string
          is_featured?: boolean
          location_preference?: string | null
          project_duration?: string | null
          skills_required?: string[] | null
          status?: string
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          applications_count?: number
          attachments?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string
          category?: string
          client_id?: string
          created_at?: string
          description?: string
          experience_level?: string | null
          id?: string
          is_featured?: boolean
          location_preference?: string | null
          project_duration?: string | null
          skills_required?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          availability: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string | null
          education: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          location: string | null
          portfolio_links: string[] | null
          profile_image_url: string | null
          provider_id: string
          rating: number | null
          reviews_count: number | null
          skills: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          education?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          portfolio_links?: string[] | null
          profile_image_url?: string | null
          provider_id: string
          rating?: number | null
          reviews_count?: number | null
          skills?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          education?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          portfolio_links?: string[] | null
          profile_image_url?: string | null
          provider_id?: string
          rating?: number | null
          reviews_count?: number | null
          skills?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      providers_worked_with: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          job_id: string | null
          provider_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          provider_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_worked_with_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          job_id: string | null
          provider_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          provider_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          provider_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          client_company: string | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          project_name: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_name?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_name?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
