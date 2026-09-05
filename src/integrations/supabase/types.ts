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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          priority: string
          progress: number
          status: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          progress?: number
          status?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          progress?: number
          status?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      course_access: {
        Row: {
          course: string | null
          created_at: string
          granted_by: string | null
          id: string
          scope: string
          section: string | null
          semester_label: string | null
          student_id: string | null
          subject_id: string
        }
        Insert: {
          course?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          scope?: string
          section?: string | null
          semester_label?: string | null
          student_id?: string | null
          subject_id: string
        }
        Update: {
          course?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          scope?: string
          section?: string | null
          semester_label?: string | null
          student_id?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_access_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          opened_at: string
          status: string
          subject_id: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          opened_at?: string
          status?: string
          subject_id: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          opened_at?: string
          status?: string
          subject_id?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          exam_date: string | null
          exam_time: string | null
          hall_ticket: string | null
          id: string
          name: string
          preparation: number
          subject_id: string | null
          syllabus: string | null
          updated_at: string
          user_id: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          exam_time?: string | null
          hall_ticket?: string | null
          id?: string
          name: string
          preparation?: number
          subject_id?: string | null
          syllabus?: string | null
          updated_at?: string
          user_id: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          exam_time?: string | null
          hall_ticket?: string | null
          id?: string
          name?: string
          preparation?: number
          subject_id?: string | null
          syllabus?: string | null
          updated_at?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          box: number
          created_at: string
          difficulty: string
          due_at: string
          id: string
          last_reviewed_at: string | null
          question: string
          reviews: number
          subject_id: string | null
          tags: string[]
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          box?: number
          created_at?: string
          difficulty?: string
          due_at?: string
          id?: string
          last_reviewed_at?: string | null
          question: string
          reviews?: number
          subject_id?: string | null
          tags?: string[]
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          box?: number
          created_at?: string
          difficulty?: string
          due_at?: string
          id?: string
          last_reviewed_at?: string | null
          question?: string
          reviews?: number
          subject_id?: string | null
          tags?: string[]
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          bookmarked: boolean
          created_at: string
          id: string
          pinned: boolean
          subject_id: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          bookmarked?: boolean
          created_at?: string
          id?: string
          pinned?: boolean
          subject_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          bookmarked?: boolean
          created_at?: string
          id?: string
          pinned?: boolean
          subject_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          category: string
          content: string | null
          created_at: string
          id: string
          semester: number | null
          storage_path: string | null
          subject_id: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          semester?: number | null
          storage_path?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          semester?: number | null
          storage_path?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "papers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      planner_slots: {
        Row: {
          created_at: string
          due_at: string | null
          duration_minutes: number
          id: string
          notes: string | null
          position: number
          slot_date: string
          start_time: string | null
          status: string
          subject_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          position?: number
          slot_date: string
          start_time?: string | null
          status?: string
          subject_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          position?: number
          slot_date?: string
          start_time?: string | null
          status?: string
          subject_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_slots_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_year: string | null
          accent: string
          avatar_url: string | null
          course: string | null
          created_at: string
          daily_goal_minutes: number
          display_name: string | null
          email: string | null
          font_size: string
          id: string
          last_login_at: string | null
          section: string | null
          semester_label: string | null
          status: string
          student_id: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          accent?: string
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string | null
          email?: string | null
          font_size?: string
          id: string
          last_login_at?: string | null
          section?: string | null
          semester_label?: string | null
          status?: string
          student_id?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          accent?: string
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string | null
          email?: string | null
          font_size?: string
          id?: string
          last_login_at?: string | null
          section?: string | null
          semester_label?: string | null
          status?: string
          student_id?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string | null
          subject_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          subject_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          subject_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes: number
          mode: string
          started_at: string
          subject_id: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes?: number
          mode?: string
          started_at?: string
          subject_id?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          mode?: string
          started_at?: string
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          academic_year: string | null
          archived: boolean
          category: string | null
          code: string | null
          color: string
          created_at: string
          created_by: string | null
          credits: number | null
          description: string | null
          duration: string | null
          estimated_hours: number | null
          favorite: boolean
          icon: string
          id: string
          is_course: boolean
          learning_outcomes: string[]
          level: string
          name: string
          position: number
          published_at: string | null
          semester: number | null
          slug: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          academic_year?: string | null
          archived?: boolean
          category?: string | null
          code?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          credits?: number | null
          description?: string | null
          duration?: string | null
          estimated_hours?: number | null
          favorite?: boolean
          icon?: string
          id?: string
          is_course?: boolean
          learning_outcomes?: string[]
          level?: string
          name: string
          position?: number
          published_at?: string | null
          semester?: number | null
          slug?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          academic_year?: string | null
          archived?: boolean
          category?: string | null
          code?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          credits?: number | null
          description?: string | null
          duration?: string | null
          estimated_hours?: number | null
          favorite?: boolean
          icon?: string
          id?: string
          is_course?: boolean
          learning_outcomes?: string[]
          level?: string
          name?: string
          position?: number
          published_at?: string | null
          semester?: number | null
          slug?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      topic_blocks: {
        Row: {
          body: string
          caption: string | null
          created_at: string
          id: string
          meta: Json
          position: number
          storage_path: string | null
          subject_id: string | null
          title: string | null
          topic_id: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string
          caption?: string | null
          created_at?: string
          id?: string
          meta?: Json
          position?: number
          storage_path?: string | null
          subject_id?: string | null
          title?: string | null
          topic_id: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          caption?: string | null
          created_at?: string
          id?: string
          meta?: Json
          position?: number
          storage_path?: string | null
          subject_id?: string | null
          title?: string | null
          topic_id?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_blocks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_blocks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          bookmarked: boolean
          completed: boolean
          content: Json
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          estimated_minutes: number
          favorite: boolean
          id: string
          last_revised_at: string | null
          next_revision_at: string | null
          position: number
          previous_question: boolean
          priority: string
          published: boolean
          revision_count: number
          subject_id: string
          title: string
          unit_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
          weak: boolean
        }
        Insert: {
          bookmarked?: boolean
          completed?: boolean
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          estimated_minutes?: number
          favorite?: boolean
          id?: string
          last_revised_at?: string | null
          next_revision_at?: string | null
          position?: number
          previous_question?: boolean
          priority?: string
          published?: boolean
          revision_count?: number
          subject_id: string
          title: string
          unit_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          weak?: boolean
        }
        Update: {
          bookmarked?: boolean
          completed?: boolean
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          estimated_minutes?: number
          favorite?: boolean
          id?: string
          last_revised_at?: string | null
          next_revision_at?: string | null
          position?: number
          previous_question?: boolean
          priority?: string
          published?: boolean
          revision_count?: number
          subject_id?: string
          title?: string
          unit_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          weak?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          position: number
          priority: string
          published: boolean
          subject_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          position?: number
          priority?: string
          published?: boolean
          subject_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          position?: number
          priority?: string
          published?: boolean
          subject_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_course: { Args: { _subject_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "student"],
    },
  },
} as const
