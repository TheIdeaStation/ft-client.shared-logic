export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          preferred_voice: string | null;
          subscription_tier: string;
          subscription_expires_at: string | null;
          is_admin: boolean;
          journey_credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          preferred_voice?: string | null;
          subscription_tier?: string;
          subscription_expires_at?: string | null;
          is_admin?: boolean;
          journey_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          preferred_voice?: string | null;
          subscription_tier?: string;
          subscription_expires_at?: string | null;
          is_admin?: boolean;
          journey_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          requirement_type: string;
          requirement_value: number;
          tier_order: number;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon: string;
          requirement_type: string;
          requirement_value: number;
          tier_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          requirement_type?: string;
          requirement_value?: number;
          tier_order?: number;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          initial_sud: number;
          current_sud: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          initial_sud: number;
          current_sud: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          initial_sud?: number;
          current_sud?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      journeys: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          goal: string | null;
          status: "active" | "paused" | "completed";
          total_sessions: number;
          completed_sessions: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          goal?: string | null;
          status?: "active" | "paused" | "completed";
          total_sessions?: number;
          completed_sessions?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          goal?: string | null;
          status?: "active" | "paused" | "completed";
          total_sessions?: number;
          completed_sessions?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      journey_issues: {
        Row: {
          id: string;
          journey_id: string;
          issue_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          journey_id: string;
          issue_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          journey_id?: string;
          issue_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          title: string;
          pre_sud: number | null;
          post_sud: number | null;
          script_json: Json | null;
          audio_url: string | null;
          audio_metadata: Json | null;
          duration_seconds: number | null;
          status: "pending" | "in_progress" | "completed" | "skipped";
          modality: "tapping" | "reframe" | "grounding" | "breath" | "affirmation" | "meditation";
          completed_at: string | null;
          survey_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          journey_id?: string | null;
          title: string;
          pre_sud?: number | null;
          post_sud?: number | null;
          script_json?: Json | null;
          audio_url?: string | null;
          audio_metadata?: Json | null;
          duration_seconds?: number | null;
          status?: "pending" | "in_progress" | "completed" | "skipped";
          modality?: "tapping" | "reframe" | "grounding" | "breath" | "affirmation" | "meditation";
          completed_at?: string | null;
          survey_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          journey_id?: string | null;
          title?: string;
          pre_sud?: number | null;
          post_sud?: number | null;
          script_json?: Json | null;
          audio_url?: string | null;
          audio_metadata?: Json | null;
          duration_seconds?: number | null;
          status?: "pending" | "in_progress" | "completed" | "skipped";
          modality?: "tapping" | "reframe" | "grounding" | "breath" | "affirmation" | "meditation";
          completed_at?: string | null;
          survey_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          session_id: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          message_type: "chat" | "intake" | "check_in" | "reflection";
          crisis_detected: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          journey_id?: string | null;
          session_id?: string | null;
          role: "user" | "assistant" | "system";
          content: string;
          message_type?: "chat" | "intake" | "check_in" | "reflection";
          crisis_detected?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          journey_id?: string | null;
          session_id?: string | null;
          role?: "user" | "assistant" | "system";
          content?: string;
          message_type?: "chat" | "intake" | "check_in" | "reflection";
          crisis_detected?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      session_reflections: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          journey_id: string;
          reflection_text: string;
          insights: Json;
          emotional_shift: string | null;
          key_themes: string[];
          recommendation: string | null;
          reflection_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          journey_id: string;
          reflection_text?: string;
          insights?: Json;
          emotional_shift?: string | null;
          key_themes?: string[];
          recommendation?: string | null;
          reflection_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          journey_id?: string;
          reflection_text?: string;
          insights?: Json;
          emotional_shift?: string | null;
          key_themes?: string[];
          recommendation?: string | null;
          reflection_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_progress: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          sessions_completed: number;
          total_tapping_seconds: number;
          average_sud_reduction: number | null;
          streak_days: number;
          journey_sessions: number;
          explore_sessions: number;
          checkins_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          sessions_completed?: number;
          total_tapping_seconds?: number;
          average_sud_reduction?: number | null;
          streak_days?: number;
          journey_sessions?: number;
          explore_sessions?: number;
          checkins_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          sessions_completed?: number;
          total_tapping_seconds?: number;
          average_sud_reduction?: number | null;
          streak_days?: number;
          journey_sessions?: number;
          explore_sessions?: number;
          checkins_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      explore_audio: {
        Row: {
          id: string;
          audio_url: string;
          audio_metadata: Json;
          voice_id: string;
          duration_ms: number;
          created_at: string;
        };
        Insert: {
          id: string;
          audio_url: string;
          audio_metadata: Json;
          voice_id?: string;
          duration_ms: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          audio_url?: string;
          audio_metadata?: Json;
          voice_id?: string;
          duration_ms?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
