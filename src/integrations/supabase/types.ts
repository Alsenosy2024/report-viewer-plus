export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      abdelsattarpost: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      bot_status: {
        Row: {
          bot_name: string
          id: string
          is_active: boolean
          last_updated: string
          updated_by: string | null
          webhook_url: string | null
        }
        Insert: {
          bot_name: string
          id?: string
          is_active?: boolean
          last_updated?: string
          updated_by?: string | null
          webhook_url?: string | null
        }
        Update: {
          bot_name?: string
          id?: string
          is_active?: boolean
          last_updated?: string
          updated_by?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_status_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ceo_helper_memmory: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_posted: boolean
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_posted?: boolean
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_posted?: boolean
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      "courses prices": {
        Row: {
          "course details": string | null
          "course name": string | null
          "course price": number | null
          currency: string | null
          id: number
        }
        Insert: {
          "course details"?: string | null
          "course name"?: string | null
          "course price"?: number | null
          currency?: string | null
          id?: number
        }
        Update: {
          "course details"?: string | null
          "course name"?: string | null
          "course price"?: number | null
          currency?: string | null
          id?: number
        }
        Relationships: []
      }
      "customer updates": {
        Row: {
          created_at: string
          id: number
          name: string | null
          number: number | null
          summary: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          number?: number | null
          summary?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          number?: number | null
          summary?: string | null
        }
        Relationships: []
      }
      "demanded courses": {
        Row: {
          created_at: string
          email: string | null
          id: number
          name: string | null
          notes: string | null
          number: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string | null
          notes?: string | null
          number?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string | null
          notes?: string | null
          number?: number | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          email: string | null
          id: number
          name: string | null
        }
        Insert: {
          email?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          email?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      meeting_summaries: {
        Row: {
          created_at: string
          id: string
          meeting_name: string | null
          meeting_type: string
          recording_url: string | null
          summary_html: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_name?: string | null
          meeting_type: string
          recording_url?: string | null
          summary_html?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_name?: string | null
          meeting_type?: string
          recording_url?: string | null
          summary_html?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messenger: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      model_maker: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      mostafa: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_dashboards: {
        Row: {
          created_at: string
          created_by_workflow: string | null
          dashboard_name: string
          html_content: string
          id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string
          version: number
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_workflow?: string | null
          dashboard_name?: string
          html_content: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
          version?: number
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_workflow?: string | null
          dashboard_name?: string
          html_content?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
          version?: number
          workflow_id?: string | null
        }
        Relationships: []
      }
      performance_history_daily: {
        Row: {
          created_at: string
          created_at_ms: number
          employee_name: string | null
          id: number
          late_tasks: string | null
          number_of_late_tasks: number | null
          number_of_tasks: number | null
          tasks: string | null
        }
        Insert: {
          created_at?: string
          created_at_ms?: number
          employee_name?: string | null
          id?: number
          late_tasks?: string | null
          number_of_late_tasks?: number | null
          number_of_tasks?: number | null
          tasks?: string | null
        }
        Update: {
          created_at?: string
          created_at_ms?: number
          employee_name?: string | null
          id?: number
          late_tasks?: string | null
          number_of_late_tasks?: number | null
          number_of_tasks?: number | null
          tasks?: string | null
        }
        Relationships: []
      }
      pmp: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string
          created_by: string
          external_post_id: string | null
          id: string
          metadata: Json | null
          platform: string
          posted_at: string | null
          posting_error: string | null
          posting_status: Database["public"]["Enums"]["posting_status_enum"]
          scheduled_for: string | null
          status: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string
          created_by: string
          external_post_id?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          posted_at?: string | null
          posting_error?: string | null
          posting_status?: Database["public"]["Enums"]["posting_status_enum"]
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string
          created_by?: string
          external_post_id?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          posted_at?: string | null
          posting_error?: string | null
          posting_status?: Database["public"]["Enums"]["posting_status_enum"]
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content: string
          content_type: string
          created_at: string
          id: string
          report_date: string
          section: Database["public"]["Enums"]["dashboard_section"]
          updated_at: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          id?: string
          report_date: string
          section: Database["public"]["Enums"]["dashboard_section"]
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          report_date?: string
          section?: Database["public"]["Enums"]["dashboard_section"]
          updated_at?: string
        }
        Relationships: []
      }
      section_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          id: string
          section: Database["public"]["Enums"]["dashboard_section"]
          user_id: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          id?: string
          section: Database["public"]["Enums"]["dashboard_section"]
          user_id: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          id?: string
          section?: Database["public"]["Enums"]["dashboard_section"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_dashboards: {
        Row: {
          analysis_data: Json
          date_generated: string
          generated_at: string
          html_content: string
          id: string
          last_update: string
          reports_analyzed: number
        }
        Insert: {
          analysis_data?: Json
          date_generated: string
          generated_at?: string
          html_content: string
          id?: string
          last_update?: string
          reports_analyzed?: number
        }
        Update: {
          analysis_data?: Json
          date_generated?: string
          generated_at?: string
          html_content?: string
          id?: string
          last_update?: string
          reports_analyzed?: number
        }
        Relationships: []
      }
      social_users: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          id: string
          reports_count: number
          updated_at: string
          week_start: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          id?: string
          reports_count?: number
          updated_at?: string
          week_start: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          id?: string
          reports_count?: number
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          chat_summary: string | null
          created_at: string
          id: number
          name: string
          phone_e164: string
          reply: Database["public"]["Enums"]["reply_enum"]
          status: Database["public"]["Enums"]["status_enum"]
        }
        Insert: {
          chat_summary?: string | null
          created_at?: string
          id?: never
          name: string
          phone_e164: string
          reply?: Database["public"]["Enums"]["reply_enum"]
          status?: Database["public"]["Enums"]["status_enum"]
        }
        Update: {
          chat_summary?: string | null
          created_at?: string
          id?: never
          name?: string
          phone_e164?: string
          reply?: Database["public"]["Enums"]["reply_enum"]
          status?: Database["public"]["Enums"]["status_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_section: {
        Args: {
          section_name: Database["public"]["Enums"]["dashboard_section"]
          user_id: string
        }
        Returns: boolean
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_testrag:
        | {
            Args: { filter: Json; match_count: number; query_embedding: string }
            Returns: {
              content: string
              id: number
              metadata: Json
              similarity: number
            }[]
          }
        | {
            Args: {
              filter?: Json
              match_count?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: number
              metadata: Json
              similarity: number
            }[]
          }
    }
    Enums: {
      dashboard_section:
        | "whatsapp_reports"
        | "productivity_reports"
        | "ads_reports"
        | "mail_reports"
        | "bot_controls"
      posting_status_enum: "not_posted" | "posting" | "posted" | "failed"
      reply_enum: "Bot" | "moderator"
      status_enum: "Todo" | "In progress" | "Done" | "new"
      user_role: "admin" | "user"
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
    Enums: {
      dashboard_section: [
        "whatsapp_reports",
        "productivity_reports",
        "ads_reports",
        "mail_reports",
        "bot_controls",
      ],
      posting_status_enum: ["not_posted", "posting", "posted", "failed"],
      reply_enum: ["Bot", "moderator"],
      status_enum: ["Todo", "In progress", "Done", "new"],
      user_role: ["admin", "user"],
    },
  },
} as const
