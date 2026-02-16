import { supabase } from "@/lib/supabase";

export interface CollisionConfig {
  collisionChancePercent: number;
  collisionMinDamage: number;
  collisionMaxDamage: number;
  collisionDurabilityLoss: number;
}

export interface CollisionResult {
  occurred: boolean;
  engineDamage: number;
  durabilityDamage: number;
}

const DEFAULT_CONFIG: CollisionConfig = {
  collisionChancePercent: 25,
  collisionMinDamage: 5,
  collisionMaxDamage: 20,
  collisionDurabilityLoss: 3,
};

let cachedConfig: CollisionConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 min

export async function getCollisionConfig(): Promise<CollisionConfig> {
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) return cachedConfig;

  const { data } = await supabase
    .from("game_config")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (data) {
    cachedConfig = {
      collisionChancePercent: data.collision_chance_percent,
      collisionMinDamage: data.collision_min_damage,
      collisionMaxDamage: data.collision_max_damage,
      collisionDurabilityLoss: data.collision_durability_loss,
    };
    cacheTime = Date.now();
    return cachedConfig;
  }
  return DEFAULT_CONFIG;
}

export function rollCollision(config: CollisionConfig): CollisionResult {
  const roll = Math.random() * 100;
  if (roll >= config.collisionChancePercent) {
    return { occurred: false, engineDamage: 0, durabilityDamage: 0 };
  }

  const range = config.collisionMaxDamage - config.collisionMinDamage;
  const engineDamage = config.collisionMinDamage + Math.round(Math.random() * range);
  const durabilityDamage = config.collisionDurabilityLoss;

  return { occurred: true, engineDamage, durabilityDamage };
}

export async function logCollision(
  carId: string,
  ownerWallet: string,
  engineDamage: number,
  durabilityDamage: number
): Promise<void> {
  await supabase.from("collision_events").insert({
    car_id: carId,
    owner_wallet: ownerWallet,
    damage_engine: engineDamage,
    damage_durability: durabilityDamage,
  });
}
