import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Player {
  id: string;
  username: string | null;
  walletAddress: string;
  nitroPoints: number;
  fuelTanks: number;
  totalRaces: number;
  totalWins: number;
  totalLosses: number;
  createdAt: string;
  carsCount: number;
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

  // Load players
  const loadPlayers = useCallback(async () => {
    const { data: users } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!users) return;

    // Get car counts per wallet
    const { data: cars } = await supabase.from("cars").select("owner_wallet");
    const carCounts: Record<string, number> = {};
    (cars ?? []).forEach((c: any) => {
      carCounts[c.owner_wallet] = (carCounts[c.owner_wallet] || 0) + 1;
    });

    setPlayers(
      users.map((u: any) => ({
        id: u.id,
        username: u.username,
        walletAddress: u.wallet_address,
        nitroPoints: u.nitro_points,
        fuelTanks: u.fuel_tanks,
        totalRaces: u.total_races,
        totalWins: u.total_wins,
        totalLosses: u.total_losses,
        createdAt: u.created_at,
        carsCount: carCounts[u.wallet_address] || 0,
      }))
    );
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

  useEffect(() => {
    if (isAdmin) {
      loadPlayers();
      loadConfig();
    }
  }, [isAdmin, loadPlayers, loadConfig]);

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
  };
};
