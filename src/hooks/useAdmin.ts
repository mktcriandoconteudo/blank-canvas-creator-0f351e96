import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { generateEconomyReport } from "@/lib/economy/reportGenerator";
import { fetchEconomyState } from "@/lib/economy";
import type { EconomyReport, EconomyState } from "@/lib/economy/types";

export interface Player {
  id: string;
  authId: string | null;
  username: string | null;
  walletAddress: string;
  nitroPoints: number;
  fuelTanks: number;
  totalRaces: number;
  totalWins: number;
  totalLosses: number;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  carsCount: number;
  avatarUrl: string | null;
}

export interface PlayerDetail extends Player {
  cars: PlayerCar[];
  insurances: PlayerInsurance[];
  recentCollisions: PlayerCollision[];
}

export interface PlayerCar {
  id: string;
  name: string;
  model: string;
  level: number;
  speed: number;
  acceleration: number;
  handling: number;
  durability: number;
  engineHealth: number;
  totalKm: number;
  wins: number;
  racesCount: number;
  xp: number;
  xpToNext: number;
  attributePoints: number;
  racesSinceRevision: number;
  lastOilChangeKm: number;
  tokenId: string;
  fuelTanks: number;
}

export interface PlayerInsurance {
  id: string;
  planType: string;
  coveragePercent: number;
  isActive: boolean;
  claimsUsed: number;
  maxClaims: number;
  racesRemaining: number;
  expiresAt: string;
}

export interface PlayerCollision {
  id: string;
  damageEngine: number;
  damageDurability: number;
  createdAt: string;
}

interface CollisionConfig {
  collisionChancePercent: number;
  collisionMinDamage: number;
  collisionMaxDamage: number;
  collisionDurabilityLoss: number;
}

export const useAdmin = () => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [collisionConfig, setCollisionConfig] = useState<CollisionConfig>({
    collisionChancePercent: 25,
    collisionMinDamage: 5,
    collisionMaxDamage: 20,
    collisionDurabilityLoss: 3,
  });
  const [saving, setSaving] = useState(false);
  const [economyReport, setEconomyReport] = useState<EconomyReport | null>(null);
  const [economyState, setEconomyState] = useState<EconomyState | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);

  // Check admin status
  useEffect(() => {
    if (!session?.user?.id) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    supabase.rpc("check_is_admin").then(({ data }) => {
      setIsAdmin(data === true);
      setLoading(false);
    });
  }, [session?.user?.id]);

  const [onlineCount, setOnlineCount] = useState(0);

  // Load players
  const loadPlayers = useCallback(async () => {
    const { data: users } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!users) return;

    // Count online users (active in last 15 minutes based on last_seen_at)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const online = users.filter((u: any) => u.last_seen_at && u.last_seen_at >= fifteenMinAgo).length;
    setOnlineCount(online);

    const { data: cars } = await supabase.from("cars").select("owner_wallet");
    const carCounts: Record<string, number> = {};
    (cars ?? []).forEach((c: any) => {
      carCounts[c.owner_wallet] = (carCounts[c.owner_wallet] || 0) + 1;
    });

    setPlayers(
      users.map((u: any) => ({
        id: u.id,
        authId: u.auth_id,
        username: u.username,
        walletAddress: u.wallet_address,
        nitroPoints: u.nitro_points,
        fuelTanks: u.fuel_tanks,
        totalRaces: u.total_races,
        totalWins: u.total_wins,
        totalLosses: u.total_losses,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        lastSeenAt: u.last_seen_at,
        carsCount: carCounts[u.wallet_address] || 0,
        avatarUrl: u.avatar_url,
      }))
    );
  }, []);

  // Load player detail
  const loadPlayerDetail = useCallback(async (player: Player) => {
    const [carsRes, insRes, collRes] = await Promise.all([
      supabase.from("cars").select("*").eq("owner_wallet", player.walletAddress),
      supabase.from("car_insurance").select("*").eq("owner_wallet", player.walletAddress).order("created_at", { ascending: false }),
      supabase.from("collision_events").select("*").eq("owner_wallet", player.walletAddress).order("created_at", { ascending: false }).limit(10),
    ]);

    const detail: PlayerDetail = {
      ...player,
      cars: (carsRes.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        model: c.model,
        level: c.level,
        speed: c.speed_base,
        acceleration: c.acceleration_base,
        handling: c.handling_base,
        durability: c.durability,
        engineHealth: c.engine_health,
        totalKm: Number(c.total_km),
        wins: c.wins,
        racesCount: c.races_count,
        xp: c.xp,
        xpToNext: c.xp_to_next,
        attributePoints: c.attribute_points,
        racesSinceRevision: c.races_since_revision,
        lastOilChangeKm: Number(c.last_oil_change_km),
        tokenId: c.token_id,
        fuelTanks: c.fuel_tanks ?? 5,
      })),
      insurances: (insRes.data ?? []).map((i: any) => ({
        id: i.id,
        planType: i.plan_type,
        coveragePercent: i.coverage_percent,
        isActive: i.is_active,
        claimsUsed: i.claims_used,
        maxClaims: i.max_claims,
        racesRemaining: i.races_remaining,
        expiresAt: i.expires_at,
      })),
      recentCollisions: (collRes.data ?? []).map((c: any) => ({
        id: c.id,
        damageEngine: c.damage_engine,
        damageDurability: c.damage_durability,
        createdAt: c.created_at,
      })),
    };

    setSelectedPlayer(detail);
  }, []);

  // Load collision config
  const loadConfig = useCallback(async () => {
    const { data } = await supabase
      .from("game_config")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (data) {
      setCollisionConfig({
        collisionChancePercent: data.collision_chance_percent,
        collisionMinDamage: data.collision_min_damage,
        collisionMaxDamage: data.collision_max_damage,
        collisionDurabilityLoss: data.collision_durability_loss,
      });
    }
  }, []);

  // Load economy
  const loadEconomy = useCallback(async () => {
    const [report, state] = await Promise.all([
      generateEconomyReport(),
      fetchEconomyState(),
    ]);
    setEconomyReport(report);
    setEconomyState(state);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadPlayers();
      loadConfig();
      loadEconomy();
    }
  }, [isAdmin, loadPlayers, loadConfig, loadEconomy]);

  const saveCollisionConfig = useCallback(
    async (config: CollisionConfig) => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("game_config")
          .update({
            collision_chance_percent: config.collisionChancePercent,
            collision_min_damage: config.collisionMinDamage,
            collision_max_damage: config.collisionMaxDamage,
            collision_durability_loss: config.collisionDurabilityLoss,
            updated_at: new Date().toISOString(),
          })
          .eq("id", "default");

        if (!error) {
          setCollisionConfig(config);
        }
        return !error;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    isAdmin,
    loading,
    players,
    collisionConfig,
    saveCollisionConfig,
    saving,
    refreshPlayers: loadPlayers,
    onlineCount,
    economyReport,
    economyState,
    refreshEconomy: loadEconomy,
    selectedPlayer,
    loadPlayerDetail,
    clearSelectedPlayer: () => setSelectedPlayer(null),
  };
};
