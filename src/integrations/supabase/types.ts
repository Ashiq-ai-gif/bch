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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_description: string | null
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_reports: {
        Row: {
          actions_report: string | null
          created_at: string | null
          end_date: string
          growth_suggestions: string | null
          habit_report: string | null
          id: string
          learning_report: string | null
          performance_rating: number | null
          report_period: Database["public"]["Enums"]["timeline_period"]
          results_report: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          actions_report?: string | null
          created_at?: string | null
          end_date: string
          growth_suggestions?: string | null
          habit_report?: string | null
          id?: string
          learning_report?: string | null
          performance_rating?: number | null
          report_period: Database["public"]["Enums"]["timeline_period"]
          results_report?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          actions_report?: string | null
          created_at?: string | null
          end_date?: string
          growth_suggestions?: string | null
          habit_report?: string | null
          id?: string
          learning_report?: string | null
          performance_rating?: number | null
          report_period?: Database["public"]["Enums"]["timeline_period"]
          results_report?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_business_logs: {
        Row: {
          ai_prediction: string | null
          created_at: string | null
          gross_profit: number
          id: string
          log_date: string
          revenue: number
          updated_at: string | null
          user_id: string
          ai_summary: string | null
        }
        Insert: {
          ai_prediction?: string | null
          created_at?: string | null
          gross_profit?: number
          id?: string
          log_date?: string
          revenue?: number
          updated_at?: string | null
          user_id: string
          ai_summary?: string | null
        }
        Update: {
          ai_prediction?: string | null
          created_at?: string | null
          gross_profit?: number
          id?: string
          log_date?: string
          revenue?: number
          updated_at?: string | null
          user_id?: string
          ai_summary?: string | null
        }
        Relationships: []
      }
      daily_habits: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          most_important_action: string | null
          updated_at: string | null
          user_id: string
          wake_up_time: string | null
          what_to_improve: string | null
          what_went_well: string | null
          what_went_wrong: string | null
          ai_summary: string | null
          todays_goal: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date?: string
          most_important_action?: string | null
          updated_at?: string | null
          user_id: string
          wake_up_time?: string | null
          what_to_improve?: string | null
          what_went_well?: string | null
          what_went_wrong?: string | null
          ai_summary?: string | null
          todays_goal?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          most_important_action?: string | null
          updated_at?: string | null
          user_id?: string
          wake_up_time?: string | null
          what_to_improve?: string | null
          what_went_well?: string | null
          what_went_wrong?: string | null
          ai_summary?: string | null
          todays_goal?: string | null
        }
        Relationships: []
      }
      daily_learning: {
        Row: {
          ai_suggestions: string | null
          created_at: string | null
          id: string
          implementation_plan: string
          learning_point: string
          log_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_suggestions?: string | null
          created_at?: string | null
          id?: string
          implementation_plan: string
          learning_point: string
          log_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_suggestions?: string | null
          created_at?: string | null
          id?: string
          implementation_plan?: string
          learning_point?: string
          log_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          baseline_monthly_revenue: number
          created_at: string | null
          five_year_target: number
          id: string
          updated_at: string | null
          user_id: string
          year_1_target: number
          year_2_target: number
          year_3_target: number
          year_4_target: number
        }
        Insert: {
          baseline_monthly_revenue: number
          created_at?: string | null
          five_year_target: number
          id?: string
          updated_at?: string | null
          user_id: string
          year_1_target: number
          year_2_target: number
          year_3_target: number
          year_4_target: number
        }
        Update: {
          baseline_monthly_revenue?: number
          created_at?: string | null
          five_year_target?: number
          id?: string
          updated_at?: string | null
          user_id?: string
          year_1_target?: number
          year_2_target?: number
          year_3_target?: number
          year_4_target?: number
        }
        Relationships: []
      }
      growth_method_logs: {
        Row: {
          created_at: string | null
          day_of_week: string
          day_priority: string
          id: string
          log_date: string
          marketing_notes: string | null
          priority_description: string | null
          sales_notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          day_priority: string
          id?: string
          log_date?: string
          marketing_notes?: string | null
          priority_description?: string | null
          sales_notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          day_priority?: string
          id?: string
          log_date?: string
          marketing_notes?: string | null
          priority_description?: string | null
          sales_notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_targets: {
        Row: {
          created_at: string | null
          id: string
          month: number
          target_revenue: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          target_revenue: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          target_revenue?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_type: Database["public"]["Enums"]["company_type"] | null
          created_at: string
          enrolled_program: Database["public"]["Enums"]["program_type"] | null
          full_name: string
          id: string
          location: string | null
          organization_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
          is_approved: boolean | null
        }
        Insert: {
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          enrolled_program?: Database["public"]["Enums"]["program_type"] | null
          full_name: string
          id?: string
          location?: string | null
          organization_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          is_approved?: boolean | null
        }
        Update: {
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          enrolled_program?: Database["public"]["Enums"]["program_type"] | null
          full_name?: string
          id?: string
          location?: string | null
          organization_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          is_approved?: boolean | null
        }
        Relationships: []
      }
      todo_items: {
        Row: {
          completed: boolean | null
          created_at: string | null
          daily_habit_id: string
          id: string
          is_ai_generated: boolean | null
          priority: number | null
          task_description: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          daily_habit_id: string
          id?: string
          is_ai_generated?: boolean | null
          priority?: number | null
          task_description: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          daily_habit_id?: string
          id?: string
          is_ai_generated?: boolean | null
          priority?: number | null
          task_description?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_items_daily_habit_id_fkey"
            columns: ["daily_habit_id"]
            isOneToOne: false
            referencedRelation: "daily_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      company_type:
      | "proprietor"
      | "partnership"
      | "llp"
      | "pvt_ltd"
      | "public_ltd"
      | "other"
      habit_category:
      | "morning_routine"
      | "sales_activity"
      | "learning"
      | "health"
      | "other"
      program_type:
      | "business_buddy"
      | "business_catalyst_hub"
      | "growth_challenge"
      timeline_period:
      | "weekly"
      | "monthly"
      | "yearly"
      | "two_year"
      | "five_year"
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
      app_role: ["admin", "moderator", "user"],
      company_type: [
        "proprietor",
        "partnership",
        "llp",
        "pvt_ltd",
        "public_ltd",
        "other",
      ],
      habit_category: [
        "morning_routine",
        "sales_activity",
        "learning",
        "health",
        "other",
      ],
      program_type: [
        "business_buddy",
        "business_catalyst_hub",
        "growth_challenge",
      ],
      timeline_period: ["weekly", "monthly", "yearly", "two_year", "five_year"],
    },
  },
} as const
