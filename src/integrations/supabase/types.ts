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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      asset_audit_log: {
        Row: {
          action: string
          asset_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_at: string
          performed_by: string
        }
        Insert: {
          action: string
          asset_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by: string
        }
        Update: {
          action?: string
          asset_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_audit_log_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string
          assigned_to: string | null
          condition: string
          created_at: string
          depreciation_rate: number | null
          description: string | null
          finance_entry_id: string | null
          id: string
          location: string | null
          name: string
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_type: string
          assigned_to?: string | null
          condition?: string
          created_at?: string
          depreciation_rate?: number | null
          description?: string | null
          finance_entry_id?: string | null
          id?: string
          location?: string | null
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          assigned_to?: string | null
          condition?: string
          created_at?: string
          depreciation_rate?: number | null
          description?: string | null
          finance_entry_id?: string | null
          id?: string
          location?: string | null
          name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_finance_entry_id_fkey"
            columns: ["finance_entry_id"]
            isOneToOne: false
            referencedRelation: "finance_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_logs: {
        Row: {
          broadcast_date: string
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          livestream_url: string | null
          notes: string | null
          platform: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          broadcast_date?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          livestream_url?: string | null
          notes?: string | null
          platform?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          broadcast_date?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          livestream_url?: string | null
          notes?: string | null
          platform?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      cbr_plans: {
        Row: {
          content: string | null
          created_at: string
          id: string
          program_id: string | null
          scripture_reference: string | null
          title: string
          updated_at: string
          week_number: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          program_id?: string | null
          scripture_reference?: string | null
          title: string
          updated_at?: string
          week_number: number
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          program_id?: string | null
          scripture_reference?: string | null
          title?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "cbr_plans_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_livestreamed: boolean | null
          is_published: boolean
          livestream_url: string | null
          location: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_livestreamed?: boolean | null
          is_published?: boolean
          livestream_url?: string | null
          location?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_livestreamed?: boolean | null
          is_published?: boolean
          livestream_url?: string | null
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_audit_log: {
        Row: {
          action: string
          entry_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_at: string
          performed_by: string
        }
        Insert: {
          action: string
          entry_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by: string
        }
        Update: {
          action?: string
          entry_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_audit_log_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "finance_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_entries: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          description: string
          entry_type: string
          id: string
          is_submitted: boolean
          recorded_by: string
          reference_number: string | null
          status: string
          submitted_at: string | null
          transaction_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          description: string
          entry_type: string
          id?: string
          is_submitted?: boolean
          recorded_by: string
          reference_number?: string | null
          status?: string
          submitted_at?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string
          entry_type?: string
          id?: string
          is_submitted?: boolean
          recorded_by?: string
          reference_number?: string | null
          status?: string
          submitted_at?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      giving_records: {
        Row: {
          amount: number
          created_at: string
          giving_date: string
          giving_type: string
          id: string
          is_anonymous: boolean
          payment_method: string | null
          payment_reference: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          giving_date?: string
          giving_type?: string
          id?: string
          is_anonymous?: boolean
          payment_method?: string | null
          payment_reference?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          giving_date?: string
          giving_type?: string
          id?: string
          is_anonymous?: boolean
          payment_method?: string | null
          payment_reference?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ministries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          leader_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mission_reports: {
        Row: {
          challenges: string | null
          created_at: string
          followups: string | null
          id: string
          mission_id: string
          salvations: number | null
          souls_reached: number | null
          submitted_by: string
          testimonies: string | null
          updated_at: string
        }
        Insert: {
          challenges?: string | null
          created_at?: string
          followups?: string | null
          id?: string
          mission_id: string
          salvations?: number | null
          souls_reached?: number | null
          submitted_by: string
          testimonies?: string | null
          updated_at?: string
        }
        Update: {
          challenges?: string | null
          created_at?: string
          followups?: string | null
          id?: string
          mission_id?: string
          salvations?: number | null
          souls_reached?: number | null
          submitted_by?: string
          testimonies?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_reports_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_team_members: {
        Row: {
          id: string
          joined_at: string
          mission_id: string
          team_role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          mission_id: string
          team_role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          mission_id?: string
          team_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_team_members_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          led_by: string | null
          location: string | null
          mission_type: string
          raised_amount: number | null
          souls_reached: number | null
          start_date: string | null
          status: string
          target_amount: number | null
          target_group: string | null
          target_souls: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          led_by?: string | null
          location?: string | null
          mission_type?: string
          raised_amount?: number | null
          souls_reached?: number | null
          start_date?: string | null
          status?: string
          target_amount?: number | null
          target_group?: string | null
          target_souls?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          led_by?: string | null
          location?: string | null
          mission_type?: string
          raised_amount?: number | null
          souls_reached?: number | null
          start_date?: string | null
          status?: string
          target_amount?: number | null
          target_group?: string | null
          target_souls?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_anonymous: boolean
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_anonymous?: boolean
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_anonymous?: boolean
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          student_id: string | null
          updated_at: string
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          enrolled_at: string
          enrolled_by: string | null
          id: string
          program_id: string
          progress: number
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          program_id: string
          progress?: number
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          program_id?: string
          progress?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          completion_threshold: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          completion_threshold?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          completion_threshold?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_updates: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          update_type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          update_type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          update_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcom_audit_log: {
        Row: {
          action: string
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_at: string
          performed_by: string
          subcom_id: string
        }
        Insert: {
          action: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by: string
          subcom_id: string
        }
        Update: {
          action?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string
          subcom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcom_audit_log_subcom_id_fkey"
            columns: ["subcom_id"]
            isOneToOne: false
            referencedRelation: "subcoms"
            referencedColumns: ["id"]
          },
        ]
      }
      subcom_members: {
        Row: {
          contact_visible: boolean
          created_at: string
          display_order: number
          id: string
          responsibilities: string | null
          role_title: string
          subcom_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_visible?: boolean
          created_at?: string
          display_order?: number
          id?: string
          responsibilities?: string | null
          role_title?: string
          subcom_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_visible?: boolean
          created_at?: string
          display_order?: number
          id?: string
          responsibilities?: string | null
          role_title?: string
          subcom_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcom_members_subcom_id_fkey"
            columns: ["subcom_id"]
            isOneToOne: false
            referencedRelation: "subcoms"
            referencedColumns: ["id"]
          },
        ]
      }
      subcoms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          ministry_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          ministry_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          ministry_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcoms_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonies: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string
          id: string
          is_approved: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      welfare_requests: {
        Row: {
          created_at: string
          description: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_subcom: { Args: { _user_id: string }; Returns: boolean }
      has_any_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_assets_role: { Args: { _user_id: string }; Returns: boolean }
      has_finance_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_enrolled: {
        Args: { _program_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "cu_chairperson"
        | "ministry_chairperson"
        | "docket_leader"
        | "finance_leader"
        | "assets_leader"
        | "ict_leader"
        | "missions_leader"
        | "welfare_officer"
        | "content_moderator"
        | "cell_group_leader"
        | "finance_subcommittee"
        | "assets_subcommittee"
        | "general_member"
        | "visitor"
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
      app_role: [
        "super_admin",
        "cu_chairperson",
        "ministry_chairperson",
        "docket_leader",
        "finance_leader",
        "assets_leader",
        "ict_leader",
        "missions_leader",
        "welfare_officer",
        "content_moderator",
        "cell_group_leader",
        "finance_subcommittee",
        "assets_subcommittee",
        "general_member",
        "visitor",
      ],
    },
  },
} as const
