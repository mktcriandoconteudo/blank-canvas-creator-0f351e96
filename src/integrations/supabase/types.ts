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
      active_rentals: {
        Row: {
          car_id: string
          expires_at: string
          id: string
          is_active: boolean
          owner_wallet: string
          races_remaining: number
          rental_car_id: string
          rented_at: string
        }
        Insert: {
          car_id: string
          expires_at?: string
          id?: string
          is_active?: boolean
          owner_wallet: string
          races_remaining?: number
          rental_car_id: string
          rented_at?: string
        }
        Update: {
          car_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          owner_wallet?: string
          races_remaining?: number
          rental_car_id?: string
          rented_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_rentals_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_rentals_rental_car_id_fkey"
            columns: ["rental_car_id"]
            isOneToOne: false
            referencedRelation: "rental_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_scores: {
        Row: {
          blocked_until: string | null
          created_at: string
          flagged: boolean
          forced_cooldown_seconds: number
          id: string
          interval_score: number
          last_calculated_at: string
          pattern_score: number
          penalty_tier: string
          reward_multiplier: number
          score: number
          updated_at: string
          variability_score: number
          wallet_address: string
          winrate_score: number
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          flagged?: boolean
          forced_cooldown_seconds?: number
          id?: string
          interval_score?: number
          last_calculated_at?: string
          pattern_score?: number
          penalty_tier?: string
          reward_multiplier?: number
          score?: number
          updated_at?: string
          variability_score?: number
          wallet_address: string
          winrate_score?: number
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          flagged?: boolean
          forced_cooldown_seconds?: number
          id?: string
          interval_score?: number
          last_calculated_at?: string
          pattern_score?: number
          penalty_tier?: string
          reward_multiplier?: number
          score?: number
          updated_at?: string
          variability_score?: number
          wallet_address?: string
          winrate_score?: number
        }
        Relationships: []
      }
      car_insurance: {
        Row: {
          car_id: string
          claims_used: number
          coverage_percent: number
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          max_claims: number
          owner_wallet: string
          plan_type: string
          premium_paid: number
          races_remaining: number
          updated_at: string
        }
        Insert: {
          car_id: string
          claims_used?: number
          coverage_percent?: number
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          max_claims?: number
          owner_wallet: string
          plan_type?: string
          premium_paid?: number
          races_remaining?: number
          updated_at?: string
        }
        Update: {
          car_id?: string
          claims_used?: number
          coverage_percent?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          max_claims?: number
          owner_wallet?: string
          plan_type?: string
          premium_paid?: number
          races_remaining?: number
          updated_at?: string
        }
        Relationships: []
      }
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
      car_race_videos: {
        Row: {
          car_image_key: string
          created_at: string
          id: string
          updated_at: string
          video_type: string
          video_url: string
        }
        Insert: {
          car_image_key: string
          created_at?: string
          id?: string
          updated_at?: string
          video_type: string
          video_url: string
        }
        Update: {
          car_image_key?: string
          created_at?: string
          id?: string
          updated_at?: string
          video_type?: string
          video_url?: string
        }
        Relationships: []
      }
      cars: {
        Row: {
          acceleration_base: number
          attribute_points: number
          created_at: string
          durability: number
          engine_health: number
          fuel_tanks: number
          handling_base: number
          id: string
          last_fuel_refill: string
          last_oil_change_km: number
          level: number
          license_plate: string
          model: string
          name: string
          owner_wallet: string
          purchased_at: string
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
          fuel_tanks?: number
          handling_base?: number
          id?: string
          last_fuel_refill?: string
          last_oil_change_km?: number
          level?: number
          license_plate?: string
          model?: string
          name?: string
          owner_wallet: string
          purchased_at?: string
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
          fuel_tanks?: number
          handling_base?: number
          id?: string
          last_fuel_refill?: string
          last_oil_change_km?: number
          level?: number
          license_plate?: string
          model?: string
          name?: string
          owner_wallet?: string
          purchased_at?: string
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
      collision_events: {
        Row: {
          car_id: string
          created_at: string
          damage_durability: number
          damage_engine: number
          id: string
          owner_wallet: string
          race_id: string | null
        }
        Insert: {
          car_id: string
          created_at?: string
          damage_durability?: number
          damage_engine?: number
          id?: string
          owner_wallet: string
          race_id?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string
          damage_durability?: number
          damage_engine?: number
          id?: string
          owner_wallet?: string
          race_id?: string | null
        }
        Relationships: []
      }
      daily_race_log: {
        Row: {
          car_id: string
          id: string
          np_earned: number
          race_duration_ms: number
          race_number: number
          raced_at: string
          wallet_address: string
          xp_earned: number
        }
        Insert: {
          car_id: string
          id?: string
          np_earned?: number
          race_duration_ms?: number
          race_number?: number
          raced_at?: string
          wallet_address: string
          xp_earned?: number
        }
        Update: {
          car_id?: string
          id?: string
          np_earned?: number
          race_duration_ms?: number
          race_number?: number
          raced_at?: string
          wallet_address?: string
          xp_earned?: number
        }
        Relationships: []
      }
      economy_events: {
        Row: {
          amount: number
          burn_amount: number
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          reward_amount: number
          treasury_amount: number
          wallet: string | null
        }
        Insert: {
          amount?: number
          burn_amount?: number
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          reward_amount?: number
          treasury_amount?: number
          wallet?: string | null
        }
        Update: {
          amount?: number
          burn_amount?: number
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          reward_amount?: number
          treasury_amount?: number
          wallet?: string | null
        }
        Relationships: []
      }
      economy_state: {
        Row: {
          created_at: string
          daily_emitted: number
          dynamic_burn_rate: number
          id: string
          last_emission_reset: string
          max_supply: number
          reward_pool_balance: number
          total_burned: number
          total_minted: number
          treasury_balance: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_emitted?: number
          dynamic_burn_rate?: number
          id?: string
          last_emission_reset?: string
          max_supply?: number
          reward_pool_balance?: number
          total_burned?: number
          total_minted?: number
          treasury_balance?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_emitted?: number
          dynamic_burn_rate?: number
          id?: string
          last_emission_reset?: string
          max_supply?: number
          reward_pool_balance?: number
          total_burned?: number
          total_minted?: number
          treasury_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      emission_config: {
        Row: {
          active_player_bonus: number
          base_daily_limit: number
          decay_rate_percent: number
          id: string
          max_player_bonus_cap: number
          min_daily_limit: number
          start_date: string
          updated_at: string
        }
        Insert: {
          active_player_bonus?: number
          base_daily_limit?: number
          decay_rate_percent?: number
          id?: string
          max_player_bonus_cap?: number
          min_daily_limit?: number
          start_date?: string
          updated_at?: string
        }
        Update: {
          active_player_bonus?: number
          base_daily_limit?: number
          decay_rate_percent?: number
          id?: string
          max_player_bonus_cap?: number
          min_daily_limit?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_config: {
        Row: {
          collision_chance_percent: number
          collision_durability_loss: number
          collision_max_damage: number
          collision_min_damage: number
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          collision_chance_percent?: number
          collision_durability_loss?: number
          collision_max_damage?: number
          collision_min_damage?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          collision_chance_percent?: number
          collision_durability_loss?: number
          collision_max_damage?: number
          collision_min_damage?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          car_id: string
          claim_type: string
          covered_amount: number
          created_at: string
          id: string
          insurance_id: string
          original_cost: number
          owner_wallet: string
          player_paid: number
        }
        Insert: {
          car_id: string
          claim_type: string
          covered_amount: number
          created_at?: string
          id?: string
          insurance_id: string
          original_cost: number
          owner_wallet: string
          player_paid: number
        }
        Update: {
          car_id?: string
          claim_type?: string
          covered_amount?: number
          created_at?: string
          id?: string
          insurance_id?: string
          original_cost?: number
          owner_wallet?: string
          player_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "car_insurance"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_cars: {
        Row: {
          acceleration_base: number
          created_at: string
          durability: number
          handling_base: number
          id: string
          image_key: string
          model: string
          name: string
          price: number
          rarity: string
          sale_active: boolean
          speed_base: number
          stock: number
          updated_at: string
        }
        Insert: {
          acceleration_base?: number
          created_at?: string
          durability?: number
          handling_base?: number
          id?: string
          image_key?: string
          model?: string
          name: string
          price?: number
          rarity?: string
          sale_active?: boolean
          speed_base?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          acceleration_base?: number
          created_at?: string
          durability?: number
          handling_base?: number
          id?: string
          image_key?: string
          model?: string
          name?: string
          price?: number
          rarity?: string
          sale_active?: boolean
          speed_base?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      mystery_box_purchases: {
        Row: {
          car_id: string | null
          car_name: string
          created_at: string
          id: string
          price_paid: number
          rarity: string
          wallet_address: string
        }
        Insert: {
          car_id?: string | null
          car_name?: string
          created_at?: string
          id?: string
          price_paid?: number
          rarity?: string
          wallet_address: string
        }
        Update: {
          car_id?: string | null
          car_name?: string
          created_at?: string
          id?: string
          price_paid?: number
          rarity?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "mystery_box_purchases_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      np_packages: {
        Row: {
          bonus_percent: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          np_amount: number
          price_brl: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          bonus_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          np_amount: number
          price_brl: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bonus_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          np_amount?: number
          price_brl?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      np_purchases: {
        Row: {
          confirmed_at: string | null
          created_at: string
          id: string
          np_amount: number
          package_id: string | null
          pix_code: string | null
          price_brl: number
          status: string
          wallet_address: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          np_amount: number
          package_id?: string | null
          pix_code?: string | null
          price_brl: number
          status?: string
          wallet_address: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          np_amount?: number
          package_id?: string | null
          pix_code?: string | null
          price_brl?: number
          status?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "np_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "np_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      np_vesting: {
        Row: {
          amount: number
          available_at: string
          created_at: string
          earned_at: string
          id: string
          source: string
          wallet_address: string
          withdrawn: boolean
        }
        Insert: {
          amount?: number
          available_at?: string
          created_at?: string
          earned_at?: string
          id?: string
          source?: string
          wallet_address: string
          withdrawn?: boolean
        }
        Update: {
          amount?: number
          available_at?: string
          created_at?: string
          earned_at?: string
          id?: string
          source?: string
          wallet_address?: string
          withdrawn?: boolean
        }
        Relationships: []
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
      race_rewards: {
        Row: {
          car_id: string
          car_name: string
          collisions: number
          created_at: string
          id: string
          np_earned: number
          position: number
          race_duration_seconds: number
          race_id: string | null
          tokens_earned: number
          victory: boolean
          wallet_address: string
          xp_earned: number
        }
        Insert: {
          car_id: string
          car_name?: string
          collisions?: number
          created_at?: string
          id?: string
          np_earned?: number
          position?: number
          race_duration_seconds?: number
          race_id?: string | null
          tokens_earned?: number
          victory?: boolean
          wallet_address: string
          xp_earned?: number
        }
        Update: {
          car_id?: string
          car_name?: string
          collisions?: number
          created_at?: string
          id?: string
          np_earned?: number
          position?: number
          race_duration_seconds?: number
          race_id?: string | null
          tokens_earned?: number
          victory?: boolean
          wallet_address?: string
          xp_earned?: number
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
      rental_cars: {
        Row: {
          acceleration_base: number
          available: boolean
          created_at: string
          durability: number
          handling_base: number
          id: string
          image_key: string
          model: string
          name: string
          races_limit: number
          rarity: string
          rental_price: number
          speed_base: number
          updated_at: string
        }
        Insert: {
          acceleration_base?: number
          available?: boolean
          created_at?: string
          durability?: number
          handling_base?: number
          id?: string
          image_key?: string
          model?: string
          name: string
          races_limit?: number
          rarity?: string
          rental_price?: number
          speed_base?: number
          updated_at?: string
        }
        Update: {
          acceleration_base?: number
          available?: boolean
          created_at?: string
          durability?: number
          handling_base?: number
          id?: string
          image_key?: string
          model?: string
          name?: string
          races_limit?: number
          rarity?: string
          rental_price?: number
          speed_base?: number
          updated_at?: string
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
      used_car_listings: {
        Row: {
          buyer_wallet: string | null
          car_id: string
          created_at: string
          id: string
          price: number
          seller_wallet: string
          sold_at: string | null
          status: string
        }
        Insert: {
          buyer_wallet?: string | null
          car_id: string
          created_at?: string
          id?: string
          price: number
          seller_wallet: string
          sold_at?: string | null
          status?: string
        }
        Update: {
          buyer_wallet?: string | null
          car_id?: string
          created_at?: string
          id?: string
          price?: number
          seller_wallet?: string
          sold_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "used_car_listings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
          last_seen_at: string | null
          locked_np: number
          nitro_points: number
          token_balance: number
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
          last_seen_at?: string | null
          locked_np?: number
          nitro_points?: number
          token_balance?: number
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
          last_seen_at?: string | null
          locked_np?: number
          nitro_points?: number
          token_balance?: number
          total_losses?: number
          total_races?: number
          total_wins?: number
          updated_at?: string
          username?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      withdrawal_config: {
        Row: {
          id: string
          min_withdrawal: number
          token_name: string
          unlock_date: string | null
          updated_at: string
          updated_by: string | null
          withdrawals_enabled: boolean
        }
        Insert: {
          id?: string
          min_withdrawal?: number
          token_name?: string
          unlock_date?: string | null
          updated_at?: string
          updated_by?: string | null
          withdrawals_enabled?: boolean
        }
        Update: {
          id?: string
          min_withdrawal?: number
          token_name?: string
          unlock_date?: string | null
          updated_at?: string
          updated_by?: string | null
          withdrawals_enabled?: boolean
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          token_name: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          token_name?: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          token_name?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buy_marketplace_car: {
        Args: { _car_id: string; _wallet: string }
        Returns: Json
      }
      buy_mystery_box: { Args: { _wallet: string }; Returns: Json }
      buy_used_car: {
        Args: { _listing_id: string; _wallet: string }
        Returns: Json
      }
      calculate_behavior_score: { Args: { _wallet: string }; Returns: Json }
      calculate_withdrawal_fee: {
        Args: { _earned_at: string }
        Returns: number
      }
      check_behavior_block: { Args: { _wallet: string }; Returns: Json }
      check_is_admin: { Args: never; Returns: boolean }
      check_race_eligibility: {
        Args: { _car_id: string; _wallet: string }
        Returns: Json
      }
      claim_insurance: {
        Args: {
          _car_id: string
          _claim_type: string
          _original_cost: number
          _wallet: string
        }
        Returns: Json
      }
      confirm_np_purchase: {
        Args: { _purchase_id: string; _wallet: string }
        Returns: Json
      }
      distribute_reward: {
        Args: { _amount: number; _reason?: string; _wallet: string }
        Returns: boolean
      }
      emit_tokens: {
        Args: { _amount: number; _reason?: string; _wallet: string }
        Returns: Json
      }
      generate_license_plate: { Args: never; Returns: string }
      get_diminishing_reward_multiplier: {
        Args: { _race_number: number }
        Returns: number
      }
      get_dynamic_burn_rate: { Args: never; Returns: number }
      get_economy_report: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_car_for_sale: {
        Args: { _car_id: string; _price: number; _wallet: string }
        Returns: Json
      }
      process_deflationary_transaction: {
        Args: { _amount: number; _description?: string; _wallet?: string }
        Returns: Json
      }
      purchase_insurance: {
        Args: {
          _car_id: string
          _coverage_percent: number
          _duration_days: number
          _max_claims: number
          _plan_type: string
          _premium: number
          _races_limit: number
          _wallet: string
        }
        Returns: Json
      }
      refill_fuel:
        | { Args: { _wallet_address: string }; Returns: boolean }
        | {
            Args: { _car_id: string; _wallet_address: string }
            Returns: boolean
          }
      rent_car: {
        Args: { _rental_car_id: string; _wallet: string }
        Returns: Json
      }
      spend_locked_np: {
        Args: { _amount: number; _reason?: string; _wallet: string }
        Returns: Json
      }
      split_reward: {
        Args: {
          _source?: string
          _total_np: number
          _wallet: string
          _xp: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
