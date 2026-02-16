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
      car_parts: {
        Row: {
          car_token_id: string | null
          created_at: string
          durability: number
          id: string
          owner_wallet: string
          part_id: string
          rarity: string
          stat_boost: number
          type: string
        }
        Insert: {
          car_token_id?: string | null
          created_at?: string
          durability?: number
          id?: string
          owner_wallet: string
          part_id: string
          rarity?: string
          stat_boost?: number
          type: string
        }
        Update: {
          car_token_id?: string | null
          created_at?: string
          durability?: number
          id?: string
          owner_wallet?: string
          part_id?: string
          rarity?: string
          stat_boost?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_parts_car_token_id_fkey"
            columns: ["car_token_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["token_id"]
          },
        ]
      }
      cars: {
        Row: {
          acceleration_base: number
          attribute_points: number
          created_at: string
          durability: number
          engine_health: number
          handling_base: number
          id: string
          last_oil_change_km: number
          level: number
          model: string
          name: string
          owner_wallet: string
          races_count: number
          races_since_revision: number
          speed_base: number
          token_id: string
          total_km: number
          updated_at: string
          wins: number
          xp: number
          xp_to_next: number
        }
        Insert: {
          acceleration_base?: number
          attribute_points?: number
          created_at?: string
          durability?: number
          engine_health?: number
          handling_base?: number
          id?: string
          last_oil_change_km?: number
          level?: number
          model?: string
          name?: string
          owner_wallet: string
          races_count?: number
          races_since_revision?: number
          speed_base?: number
          token_id: string
          total_km?: number
          updated_at?: string
          wins?: number
          xp?: number
          xp_to_next?: number
        }
        Update: {
          acceleration_base?: number
          attribute_points?: number
          created_at?: string
          durability?: number
          engine_health?: number
          handling_base?: number
          id?: string
          last_oil_change_km?: number
          level?: number
          model?: string
          name?: string
          owner_wallet?: string
          races_count?: number
          races_since_revision?: number
          speed_base?: number
          token_id?: string
          total_km?: number
          updated_at?: string
          wins?: number
          xp?: number
          xp_to_next?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_owner_wallet_fkey"
            columns: ["owner_wallet"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      onchain_events: {
        Row: {
          block_number: number
          chain_id: number
          confirmations: number
          created_at: string
          event_name: string
          id: string
          indexed_at: string
          payload_json: Json
          tx_hash: string
          wallet: string
        }
        Insert: {
          block_number: number
          chain_id?: number
          confirmations?: number
          created_at?: string
          event_name: string
          id?: string
          indexed_at?: string
          payload_json?: Json
          tx_hash: string
          wallet: string
        }
        Update: {
          block_number?: number
          chain_id?: number
          confirmations?: number
          created_at?: string
          event_name?: string
          id?: string
          indexed_at?: string
          payload_json?: Json
          tx_hash?: string
          wallet?: string
        }
        Relationships: []
      }
      races: {
        Row: {
          climate: string
          created_at: string
          finished_at: string | null
          id: string
          players: Json
          prize_pool: number
          race_id: string
          result: Json | null
          status: string
          track: string
        }
        Insert: {
          climate?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          players?: Json
          prize_pool?: number
          race_id?: string
          result?: Json | null
          status?: string
          track?: string
        }
        Update: {
          climate?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          players?: Json
          prize_pool?: number
          race_id?: string
          result?: Json | null
          status?: string
          track?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          from_wallet: string
          id: string
          metadata: Json | null
          status: string
          to_wallet: string | null
          token_id: string | null
          tx_hash: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          from_wallet: string
          id?: string
          metadata?: Json | null
          status?: string
          to_wallet?: string | null
          token_id?: string | null
          tx_hash: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_wallet?: string
          id?: string
          metadata?: Json | null
          status?: string
          to_wallet?: string | null
          token_id?: string | null
          tx_hash?: string
          type?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string
          fuel_tanks: number
          id: string
          last_fuel_refill: string
          nitro_points: number
          total_losses: number
          total_races: number
          total_wins: number
          updated_at: string
          username: string | null
          wallet_address: string
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          fuel_tanks?: number
          id?: string
          last_fuel_refill?: string
          nitro_points?: number
          total_losses?: number
          total_races?: number
          total_wins?: number
          updated_at?: string
          username?: string | null
          wallet_address: string
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          fuel_tanks?: number
          id?: string
          last_fuel_refill?: string
          nitro_points?: number
          total_losses?: number
          total_races?: number
          total_wins?: number
          updated_at?: string
          username?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      refill_fuel:
        | { Args: { _wallet_address: string }; Returns: boolean }
        | {
            Args: { _car_id: string; _wallet_address: string }
            Returns: boolean
          }
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
