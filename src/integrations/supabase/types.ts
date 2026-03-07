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
      answer_options: {
        Row: {
          created_at: string
          dimension: string | null
          id: string
          option_order: number
          option_text: string
          question_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          dimension?: string | null
          id?: string
          option_order: number
          option_text: string
          question_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          dimension?: string | null
          id?: string
          option_order?: number
          option_text?: string
          question_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          created_at: string
          data_nascimento: string | null
          empresa_id: string
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          empresa_id: string
          id?: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          empresa_id?: string
          id?: string
          nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          celular: string | null
          cep: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          numero: string | null
          profile_id: string
          razao_social: string | null
          rua: string | null
          telefone: string | null
        }
        Insert: {
          celular?: string | null
          cep?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          numero?: string | null
          profile_id: string
          razao_social?: string | null
          rua?: string | null
          telefone?: string | null
        }
        Update: {
          celular?: string | null
          cep?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          numero?: string | null
          profile_id?: string
          razao_social?: string | null
          rua?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          created_at: string
          id: string
          report_content: string | null
          scores: Json | null
          submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_content?: string | null
          scores?: Json | null
          submission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_content?: string | null
          scores?: Json | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          empresa_id: string | null
          expires_at: string
          id: string
          invited_by: string | null
          profissional_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          empresa_id?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          profissional_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          empresa_id?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          profissional_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          created_at: string
          email: string | null
          endereco: string | null
          estado_civil: string | null
          id: string
          idade: number | null
          nome: string | null
          profissional_id: string
          sexo: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          idade?: number | null
          nome?: string | null
          profissional_id: string
          sexo?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          idade?: number | null
          nome?: string | null
          profissional_id?: string
          sexo?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          status: string
          submission_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          asaas_payment_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          submission_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          submission_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          asaas_customer_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          subscription_plan: string | null
          subscription_status: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          asaas_customer_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          subscription_plan?: string | null
          subscription_status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          asaas_customer_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          created_at: string
          endereco: string | null
          estado_civil: string | null
          id: string
          idade: number | null
          profile_id: string
          sexo: string | null
        }
        Insert: {
          created_at?: string
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          idade?: number | null
          profile_id: string
          sexo?: string | null
        }
        Update: {
          created_at?: string
          endereco?: string | null
          estado_civil?: string | null
          id?: string
          idade?: number | null
          profile_id?: string
          sexo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          id: string
          question_order: number
          question_text: string
          question_type: string | null
          test_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_order: number
          question_text: string
          question_type?: string | null
          test_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_order?: number
          question_text?: string
          question_type?: string | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          output_format: string | null
          system_prompt: string | null
          template_name: string
          test_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          output_format?: string | null
          system_prompt?: string | null
          template_name: string
          test_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          output_format?: string | null
          system_prompt?: string | null
          template_name?: string
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_answers: {
        Row: {
          answer_option_id: string | null
          created_at: string
          id: string
          question_id: string | null
          submission_id: string
        }
        Insert: {
          answer_option_id?: string | null
          created_at?: string
          id?: string
          question_id?: string | null
          submission_id: string
        }
        Update: {
          answer_option_id?: string | null
          created_at?: string
          id?: string
          question_id?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_answers_answer_option_id_fkey"
            columns: ["answer_option_id"]
            isOneToOne: false
            referencedRelation: "answer_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          price: number
          slug: string
          target_role: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name: string
          price?: number
          slug: string
          target_role: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          price?: number
          slug?: string
          target_role?: string
        }
        Relationships: []
      }
      test_submissions: {
        Row: {
          applied_by: string | null
          colaborador_id: string | null
          completed_at: string | null
          id: string
          paciente_id: string | null
          paid: boolean
          paid_at: string | null
          payment_id: string | null
          payment_status: string | null
          report_generated_at: string | null
          respondent_email: string
          respondent_name: string
          started_at: string
          status: string | null
          test_id: string | null
          test_result_unlocked: boolean
          user_id: string | null
        }
        Insert: {
          applied_by?: string | null
          colaborador_id?: string | null
          completed_at?: string | null
          id?: string
          paciente_id?: string | null
          paid?: boolean
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          report_generated_at?: string | null
          respondent_email: string
          respondent_name: string
          started_at?: string
          status?: string | null
          test_id?: string | null
          test_result_unlocked?: boolean
          user_id?: string | null
        }
        Update: {
          applied_by?: string | null
          colaborador_id?: string | null
          completed_at?: string | null
          id?: string
          paciente_id?: string | null
          paid?: boolean
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          report_generated_at?: string | null
          respondent_email?: string
          respondent_name?: string
          started_at?: string
          status?: string | null
          test_id?: string | null
          test_result_unlocked?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          gradient: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          long_description: string | null
          price: number | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          long_description?: string | null
          price?: number | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          long_description?: string | null
          price?: number | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_testes: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          profile_id: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          profile_id: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          profile_id?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_testes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      log_audit_event: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type: string
          _metadata?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "professional" | "company" | "reseller" | "user"
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
      app_role: ["admin", "professional", "company", "reseller", "user"],
    },
  },
} as const
