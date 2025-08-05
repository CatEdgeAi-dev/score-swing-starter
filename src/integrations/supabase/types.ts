export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          community_type: string
          contact_email: string | null
          course_affiliation: string | null
          created_at: string
          created_by: string
          description: string | null
          handicap_requirement_max: number | null
          handicap_requirement_min: number | null
          id: string
          image_url: string | null
          is_private: boolean
          location: string | null
          member_limit: number | null
          name: string
          rules_description: string | null
          skill_level_requirement: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          community_type?: string
          contact_email?: string | null
          course_affiliation?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          handicap_requirement_max?: number | null
          handicap_requirement_min?: number | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          location?: string | null
          member_limit?: number | null
          name: string
          rules_description?: string | null
          skill_level_requirement?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          community_type?: string
          contact_email?: string | null
          course_affiliation?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          handicap_requirement_max?: number | null
          handicap_requirement_min?: number | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          location?: string | null
          member_limit?: number | null
          name?: string
          rules_description?: string | null
          skill_level_requirement?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      community_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          reward_description: string | null
          start_date: string
          target_metric: string
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          reward_description?: string | null
          start_date: string
          target_metric: string
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          reward_description?: string | null
          start_date?: string
          target_metric?: string
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_events: {
        Row: {
          community_id: string
          course_name: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          entry_fee: number | null
          event_type: string
          format_description: string | null
          handicap_requirement_max: number | null
          handicap_requirement_min: number | null
          id: string
          max_participants: number | null
          name: string
          prize_description: string | null
          registration_deadline: string | null
          skill_level_requirement: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          community_id: string
          course_name?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          entry_fee?: number | null
          event_type?: string
          format_description?: string | null
          handicap_requirement_max?: number | null
          handicap_requirement_min?: number | null
          id?: string
          max_participants?: number | null
          name: string
          prize_description?: string | null
          registration_deadline?: string | null
          skill_level_requirement?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          course_name?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          entry_fee?: number | null
          event_type?: string
          format_description?: string | null
          handicap_requirement_max?: number | null
          handicap_requirement_min?: number | null
          id?: string
          max_participants?: number | null
          name?: string
          prize_description?: string | null
          registration_deadline?: string | null
          skill_level_requirement?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          invited_by: string | null
          joined_at: string
          notes: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          notes?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          notes?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean
          metadata: Json | null
          post_type: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          metadata?: Json | null
          post_type?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          metadata?: Json | null
          post_type?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      community_rankings: {
        Row: {
          average_score: number | null
          best_score: number | null
          community_id: string
          events_played: number | null
          id: string
          last_updated: string
          period_end: string | null
          period_start: string | null
          points: number | null
          rank_position: number
          ranking_type: string
          user_id: string
        }
        Insert: {
          average_score?: number | null
          best_score?: number | null
          community_id: string
          events_played?: number | null
          id?: string
          last_updated?: string
          period_end?: string | null
          period_start?: string | null
          points?: number | null
          rank_position: number
          ranking_type?: string
          user_id: string
        }
        Update: {
          average_score?: number | null
          best_score?: number | null
          community_id?: string
          events_played?: number | null
          id?: string
          last_updated?: string
          period_end?: string | null
          period_start?: string | null
          points?: number | null
          rank_position?: number
          ranking_type?: string
          user_id?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          event_id: string
          handicap_at_registration: number | null
          id: string
          notes: string | null
          payment_status: string | null
          registration_date: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          handicap_at_registration?: number | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_date?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          handicap_at_registration?: number | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      flight_handicap_validations: {
        Row: {
          claimed_handicap: number | null
          created_at: string
          flight_id: string
          id: string
          updated_at: string
          validated_user_id: string
          validation_notes: string | null
          validation_status: string
          validator_user_id: string
        }
        Insert: {
          claimed_handicap?: number | null
          created_at?: string
          flight_id: string
          id?: string
          updated_at?: string
          validated_user_id: string
          validation_notes?: string | null
          validation_status?: string
          validator_user_id: string
        }
        Update: {
          claimed_handicap?: number | null
          created_at?: string
          flight_id?: string
          id?: string
          updated_at?: string
          validated_user_id?: string
          validation_notes?: string | null
          validation_status?: string
          validator_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_handicap_validations_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_players: {
        Row: {
          created_at: string
          flight_id: string
          guest_name: string | null
          handicap: number | null
          handicap_locked: boolean
          id: string
          player_order: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          flight_id: string
          guest_name?: string | null
          handicap?: number | null
          handicap_locked?: boolean
          id?: string
          player_order?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          flight_id?: string
          guest_name?: string | null
          handicap?: number | null
          handicap_locked?: boolean
          id?: string
          player_order?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_players_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          course_name: string | null
          created_at: string
          created_by: string
          date_played: string
          id: string
          name: string
          updated_at: string
          weather: string | null
        }
        Insert: {
          course_name?: string | null
          created_at?: string
          created_by: string
          date_played?: string
          id?: string
          name?: string
          updated_at?: string
          weather?: string | null
        }
        Update: {
          course_name?: string | null
          created_at?: string
          created_by?: string
          date_played?: string
          id?: string
          name?: string
          updated_at?: string
          weather?: string | null
        }
        Relationships: []
      }
      handicap_submissions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          proof_image_url: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
          whs_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          proof_image_url: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
          whs_index: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          proof_image_url?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
          whs_index?: number
        }
        Relationships: []
      }
      holes: {
        Row: {
          created_at: string
          fairway_hit: boolean
          green_in_regulation: boolean
          hole_number: number
          id: string
          notes: string | null
          par: number
          putts: number
          round_id: string
          strokes: number
          up_and_down: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          fairway_hit?: boolean
          green_in_regulation?: boolean
          hole_number: number
          id?: string
          notes?: string | null
          par: number
          putts?: number
          round_id: string
          strokes?: number
          up_and_down?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          fairway_hit?: boolean
          green_in_regulation?: boolean
          hole_number?: number
          id?: string
          notes?: string | null
          par?: number
          putts?: number
          round_id?: string
          strokes?: number
          up_and_down?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      match_preferences: {
        Row: {
          created_at: string
          handicap_range_preference: string | null
          id: string
          is_active: boolean
          max_travel_distance: number | null
          notes: string | null
          preferred_age_ranges: string[] | null
          preferred_game_types: string[] | null
          preferred_group_size: number | null
          preferred_playing_times: string[] | null
          preferred_skill_levels: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handicap_range_preference?: string | null
          id?: string
          is_active?: boolean
          max_travel_distance?: number | null
          notes?: string | null
          preferred_age_ranges?: string[] | null
          preferred_game_types?: string[] | null
          preferred_group_size?: number | null
          preferred_playing_times?: string[] | null
          preferred_skill_levels?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handicap_range_preference?: string | null
          id?: string
          is_active?: boolean
          max_travel_distance?: number | null
          notes?: string | null
          preferred_age_ranges?: string[] | null
          preferred_game_types?: string[] | null
          preferred_group_size?: number | null
          preferred_playing_times?: string[] | null
          preferred_skill_levels?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_interactions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          availability: string[] | null
          community_onboarding_completed: boolean | null
          community_onboarding_step: number | null
          competitive_play_interest: boolean | null
          created_at: string
          display_name: string | null
          experience_level: string | null
          favorite_course_type: string | null
          golf_goals: string[] | null
          group_play_interest: boolean | null
          handicap_proof_url: string | null
          handicap_rejection_reason: string | null
          handicap_reviewed_at: string | null
          handicap_reviewed_by: string | null
          handicap_status: string | null
          handicap_submitted_at: string | null
          handicap_updated_at: string | null
          hobbies: string[] | null
          home_course: string | null
          id: string
          location: string | null
          mentoring_interest: string | null
          occupation: string | null
          open_to_matches: boolean | null
          playing_frequency: string | null
          preferred_tee_times: string[] | null
          profile_completion_percentage: number | null
          profile_visibility: string | null
          show_contact_info: boolean | null
          show_handicap: boolean | null
          show_location: boolean | null
          updated_at: string
          whs_index: number | null
        }
        Insert: {
          age_range?: string | null
          availability?: string[] | null
          community_onboarding_completed?: boolean | null
          community_onboarding_step?: number | null
          competitive_play_interest?: boolean | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          favorite_course_type?: string | null
          golf_goals?: string[] | null
          group_play_interest?: boolean | null
          handicap_proof_url?: string | null
          handicap_rejection_reason?: string | null
          handicap_reviewed_at?: string | null
          handicap_reviewed_by?: string | null
          handicap_status?: string | null
          handicap_submitted_at?: string | null
          handicap_updated_at?: string | null
          hobbies?: string[] | null
          home_course?: string | null
          id: string
          location?: string | null
          mentoring_interest?: string | null
          occupation?: string | null
          open_to_matches?: boolean | null
          playing_frequency?: string | null
          preferred_tee_times?: string[] | null
          profile_completion_percentage?: number | null
          profile_visibility?: string | null
          show_contact_info?: boolean | null
          show_handicap?: boolean | null
          show_location?: boolean | null
          updated_at?: string
          whs_index?: number | null
        }
        Update: {
          age_range?: string | null
          availability?: string[] | null
          community_onboarding_completed?: boolean | null
          community_onboarding_step?: number | null
          competitive_play_interest?: boolean | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          favorite_course_type?: string | null
          golf_goals?: string[] | null
          group_play_interest?: boolean | null
          handicap_proof_url?: string | null
          handicap_rejection_reason?: string | null
          handicap_reviewed_at?: string | null
          handicap_reviewed_by?: string | null
          handicap_status?: string | null
          handicap_submitted_at?: string | null
          handicap_updated_at?: string | null
          hobbies?: string[] | null
          home_course?: string | null
          id?: string
          location?: string | null
          mentoring_interest?: string | null
          occupation?: string | null
          open_to_matches?: boolean | null
          playing_frequency?: string | null
          preferred_tee_times?: string[] | null
          profile_completion_percentage?: number | null
          profile_visibility?: string | null
          show_contact_info?: boolean | null
          show_handicap?: boolean | null
          show_location?: boolean | null
          updated_at?: string
          whs_index?: number | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          course_name: string | null
          created_at: string
          date_played: string
          fairways_hit: number
          flight_id: string | null
          flight_name: string | null
          greens_in_regulation: number
          id: string
          is_flight_round: boolean
          player_id: string | null
          total_putts: number
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_name?: string | null
          created_at?: string
          date_played?: string
          fairways_hit?: number
          flight_id?: string | null
          flight_name?: string | null
          greens_in_regulation?: number
          id?: string
          is_flight_round?: boolean
          player_id?: string | null
          total_putts?: number
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_name?: string | null
          created_at?: string
          date_played?: string
          fairways_hit?: number
          flight_id?: string | null
          flight_name?: string | null
          greens_in_regulation?: number
          id?: string
          is_flight_round?: boolean
          player_id?: string | null
          total_putts?: number
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "flight_players"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          challenge_id: string | null
          description: string | null
          earned_at: string
          id: string
          is_featured: boolean
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          challenge_id?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          is_featured?: boolean
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          challenge_id?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          is_featured?: boolean
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      calculate_profile_completion: {
        Args: { profile_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      user_can_access_flight: {
        Args: { flight_id: string }
        Returns: boolean
      }
      user_created_flight: {
        Args: { flight_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "support"
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
      app_role: ["user", "admin", "support"],
    },
  },
} as const
