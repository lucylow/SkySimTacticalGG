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
      grid_events: {
        Row: {
          event_type: string | null
          id: string
          inserted_at: string | null
          match_id: string | null
          payload: Json | null
          player_id: string | null
          provider: string
          provider_event_id: string | null
          timestamp: number | null
        }
        Insert: {
          event_type?: string | null
          id?: string
          inserted_at?: string | null
          match_id?: string | null
          payload?: Json | null
          player_id?: string | null
          provider: string
          provider_event_id?: string | null
          timestamp?: number | null
        }
        Update: {
          event_type?: string | null
          id?: string
          inserted_at?: string | null
          match_id?: string | null
          payload?: Json | null
          player_id?: string | null
          provider?: string
          provider_event_id?: string | null
          timestamp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "grid_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "grid_players"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_ingest_audit: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          message: string | null
          provider: string
          provider_resource_id: string | null
          raw: Json | null
          status: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          provider: string
          provider_resource_id?: string | null
          raw?: Json | null
          status?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          provider?: string
          provider_resource_id?: string | null
          raw?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      grid_matches: {
        Row: {
          duration_seconds: number | null
          id: string
          inserted_at: string | null
          map_name: string | null
          match_ts: string | null
          meta: Json | null
          provider: string
          provider_match_id: string
          raw: Json | null
          updated_at: string | null
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          inserted_at?: string | null
          map_name?: string | null
          match_ts?: string | null
          meta?: Json | null
          provider: string
          provider_match_id: string
          raw?: Json | null
          updated_at?: string | null
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          inserted_at?: string | null
          map_name?: string | null
          match_ts?: string | null
          meta?: Json | null
          provider?: string
          provider_match_id?: string
          raw?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grid_micro_signals: {
        Row: {
          computed_at: string | null
          id: string
          match_id: string | null
          player_id: string | null
          provider: string
          signals: Json | null
        }
        Insert: {
          computed_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          provider: string
          signals?: Json | null
        }
        Update: {
          computed_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          provider?: string
          signals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_micro_signals_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "grid_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_micro_signals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "grid_players"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_players: {
        Row: {
          agent_champion: string | null
          first_seen: string | null
          id: string
          last_seen: string | null
          meta: Json | null
          provider: string
          provider_player_id: string
          role: string | null
          summoner_name: string | null
        }
        Insert: {
          agent_champion?: string | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          meta?: Json | null
          provider: string
          provider_player_id: string
          role?: string | null
          summoner_name?: string | null
        }
        Update: {
          agent_champion?: string | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          meta?: Json | null
          provider?: string
          provider_player_id?: string
          role?: string | null
          summoner_name?: string | null
        }
        Relationships: []
      }
      val_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          player_id: string | null
          position: Json | null
          round_id: string
          team_id: string | null
          timestamp: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          player_id?: string | null
          position?: Json | null
          round_id: string
          team_id?: string | null
          timestamp: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          player_id?: string | null
          position?: Json | null
          round_id?: string
          team_id?: string | null
          timestamp?: number
        }
        Relationships: [
          {
            foreignKeyName: "val_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "val_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_events_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "val_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_ingest_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          message: string | null
          payload: Json | null
          resource_id: string | null
          resource_type: string
          status: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          resource_id?: string | null
          resource_type: string
          status?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string
          status?: string | null
        }
        Relationships: []
      }
      val_maps: {
        Row: {
          attacker_score: number | null
          attacking_team_id: string | null
          created_at: string
          defender_score: number | null
          defending_team_id: string | null
          id: string
          map_name: string
          map_number: number
          match_id: string
          meta: Json | null
          went_overtime: boolean | null
          winner_team_id: string | null
        }
        Insert: {
          attacker_score?: number | null
          attacking_team_id?: string | null
          created_at?: string
          defender_score?: number | null
          defending_team_id?: string | null
          id?: string
          map_name: string
          map_number: number
          match_id: string
          meta?: Json | null
          went_overtime?: boolean | null
          winner_team_id?: string | null
        }
        Update: {
          attacker_score?: number | null
          attacking_team_id?: string | null
          created_at?: string
          defender_score?: number | null
          defending_team_id?: string | null
          id?: string
          map_name?: string
          map_number?: number
          match_id?: string
          meta?: Json | null
          went_overtime?: boolean | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "val_maps_attacking_team_id_fkey"
            columns: ["attacking_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_maps_defending_team_id_fkey"
            columns: ["defending_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_maps_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "val_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_maps_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_matches: {
        Row: {
          best_of: number | null
          created_at: string
          id: string
          meta: Json | null
          provider_match_id: string | null
          stage: string | null
          start_ts: string | null
          status: string | null
          team_a_id: string | null
          team_b_id: string | null
          tournament: string | null
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          best_of?: number | null
          created_at?: string
          id?: string
          meta?: Json | null
          provider_match_id?: string | null
          stage?: string | null
          start_ts?: string | null
          status?: string | null
          team_a_id?: string | null
          team_b_id?: string | null
          tournament?: string | null
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          best_of?: number | null
          created_at?: string
          id?: string
          meta?: Json | null
          provider_match_id?: string | null
          stage?: string | null
          start_ts?: string | null
          status?: string | null
          team_a_id?: string | null
          team_b_id?: string | null
          tournament?: string | null
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "val_matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_players: {
        Row: {
          created_at: string
          handle: string
          id: string
          meta: Json | null
          primary_role: string | null
          provider_player_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          meta?: Json | null
          primary_role?: string | null
          provider_player_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          meta?: Json | null
          primary_role?: string | null
          provider_player_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "val_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_role_agent_patterns: {
        Row: {
          agent: string
          entry_success_rate: number | null
          first_blood_rate: number | null
          games: number | null
          id: string
          map_name: string
          meta: Json | null
          player_id: string | null
          role: string
          team_id: string
          updated_at: string
          utility_efficiency_score: number | null
          winrate: number | null
        }
        Insert: {
          agent: string
          entry_success_rate?: number | null
          first_blood_rate?: number | null
          games?: number | null
          id?: string
          map_name: string
          meta?: Json | null
          player_id?: string | null
          role: string
          team_id: string
          updated_at?: string
          utility_efficiency_score?: number | null
          winrate?: number | null
        }
        Update: {
          agent?: string
          entry_success_rate?: number | null
          first_blood_rate?: number | null
          games?: number | null
          id?: string
          map_name?: string
          meta?: Json | null
          player_id?: string | null
          role?: string
          team_id?: string
          updated_at?: string
          utility_efficiency_score?: number | null
          winrate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "val_role_agent_patterns_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "val_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_role_agent_patterns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_round_players: {
        Row: {
          agent: string
          assists: number | null
          created_at: string
          damage_dealt: number | null
          damage_taken: number | null
          deaths: number | null
          defuses: number | null
          first_deaths: number | null
          first_kills: number | null
          flash_assists: number | null
          id: string
          is_clutch_attempt: boolean | null
          is_clutch_win: boolean | null
          kills: number | null
          meta: Json | null
          plants: number | null
          player_id: string
          role: string | null
          round_id: string
          team_id: string | null
          trade_kills: number | null
          traded_deaths: number | null
        }
        Insert: {
          agent: string
          assists?: number | null
          created_at?: string
          damage_dealt?: number | null
          damage_taken?: number | null
          deaths?: number | null
          defuses?: number | null
          first_deaths?: number | null
          first_kills?: number | null
          flash_assists?: number | null
          id?: string
          is_clutch_attempt?: boolean | null
          is_clutch_win?: boolean | null
          kills?: number | null
          meta?: Json | null
          plants?: number | null
          player_id: string
          role?: string | null
          round_id: string
          team_id?: string | null
          trade_kills?: number | null
          traded_deaths?: number | null
        }
        Update: {
          agent?: string
          assists?: number | null
          created_at?: string
          damage_dealt?: number | null
          damage_taken?: number | null
          deaths?: number | null
          defuses?: number | null
          first_deaths?: number | null
          first_kills?: number | null
          flash_assists?: number | null
          id?: string
          is_clutch_attempt?: boolean | null
          is_clutch_win?: boolean | null
          kills?: number | null
          meta?: Json | null
          plants?: number | null
          player_id?: string
          role?: string | null
          round_id?: string
          team_id?: string | null
          trade_kills?: number | null
          traded_deaths?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "val_round_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "val_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_round_players_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "val_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_round_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_rounds: {
        Row: {
          attacker_loadout_type: string | null
          attacking_team_id: string | null
          created_at: string
          defender_loadout_type: string | null
          defending_team_id: string | null
          id: string
          map_id: string
          meta: Json | null
          round_duration: number | null
          round_number: number
          spike_defused: boolean | null
          spike_plant_time: number | null
          spike_planted: boolean | null
          spike_site: string | null
          win_reason: string | null
          winner_team_id: string | null
        }
        Insert: {
          attacker_loadout_type?: string | null
          attacking_team_id?: string | null
          created_at?: string
          defender_loadout_type?: string | null
          defending_team_id?: string | null
          id?: string
          map_id: string
          meta?: Json | null
          round_duration?: number | null
          round_number: number
          spike_defused?: boolean | null
          spike_plant_time?: number | null
          spike_planted?: boolean | null
          spike_site?: string | null
          win_reason?: string | null
          winner_team_id?: string | null
        }
        Update: {
          attacker_loadout_type?: string | null
          attacking_team_id?: string | null
          created_at?: string
          defender_loadout_type?: string | null
          defending_team_id?: string | null
          id?: string
          map_id?: string
          meta?: Json | null
          round_duration?: number | null
          round_number?: number
          spike_defused?: boolean | null
          spike_plant_time?: number | null
          spike_planted?: boolean | null
          spike_site?: string | null
          win_reason?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "val_rounds_attacking_team_id_fkey"
            columns: ["attacking_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_rounds_defending_team_id_fkey"
            columns: ["defending_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_rounds_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "val_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_rounds_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_team_map_stats: {
        Row: {
          attack_winrate: number | null
          avg_plant_time: number | null
          bonus_round_conversion: number | null
          defense_winrate: number | null
          eco_conversion_rate: number | null
          id: string
          map_name: string
          meta: Json | null
          pistol_winrate: number | null
          post_plant_winrate: number | null
          retake_success_rate: number | null
          sample_size_maps: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          attack_winrate?: number | null
          avg_plant_time?: number | null
          bonus_round_conversion?: number | null
          defense_winrate?: number | null
          eco_conversion_rate?: number | null
          id?: string
          map_name: string
          meta?: Json | null
          pistol_winrate?: number | null
          post_plant_winrate?: number | null
          retake_success_rate?: number | null
          sample_size_maps?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          attack_winrate?: number | null
          avg_plant_time?: number | null
          bonus_round_conversion?: number | null
          defense_winrate?: number | null
          eco_conversion_rate?: number | null
          id?: string
          map_name?: string
          meta?: Json | null
          pistol_winrate?: number | null
          post_plant_winrate?: number | null
          retake_success_rate?: number | null
          sample_size_maps?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "val_team_map_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      val_teams: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          name: string
          region: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          name: string
          region?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          name?: string
          region?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      val_win_condition_insights: {
        Row: {
          confidence: number | null
          created_at: string
          description: string | null
          effect_size: number | null
          evidence: Json | null
          headline: string
          id: string
          insight_type: string | null
          map_name: string | null
          matchup_hash: string
          meta: Json | null
          opponent_team_id: string | null
          priority: number | null
          team_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          effect_size?: number | null
          evidence?: Json | null
          headline: string
          id?: string
          insight_type?: string | null
          map_name?: string | null
          matchup_hash: string
          meta?: Json | null
          opponent_team_id?: string | null
          priority?: number | null
          team_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          effect_size?: number | null
          evidence?: Json | null
          headline?: string
          id?: string
          insight_type?: string | null
          map_name?: string | null
          matchup_hash?: string
          meta?: Json | null
          opponent_team_id?: string | null
          priority?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "val_win_condition_insights_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "val_win_condition_insights_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "val_teams"
            referencedColumns: ["id"]
          },
        ]
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
