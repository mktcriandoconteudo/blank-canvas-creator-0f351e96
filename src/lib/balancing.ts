/**
 * Balancing Engine — PowerScore, Dynamic Difficulty, Anti-Farm, Reward Caps
 *
 * Connects car attributes to real gameplay mechanics and protects NP economy.
 */

// ─── Attribute Caps ───
export const STAT_CAPS = {
  speed: 100,
  acceleration: 100,
  handling: 100,
  durability: 100,
} as const;

// ─── PowerScore Calculation ───
export interface PowerScoreInput {
  speed: number;
  acceleration: number;
  handling: number;
  durability: number;
}

export const calculatePowerScore = (stats: PowerScoreInput): number => {
  const s = Math.min(stats.speed, STAT_CAPS.speed);
  const a = Math.min(stats.acceleration, STAT_CAPS.acceleration);
  const h = Math.min(stats.handling, STAT_CAPS.handling);
  const d = Math.min(stats.durability, STAT_CAPS.durability);
  return s * 0.35 + a * 0.30 + h * 0.20 + d * 0.15;
};

// ─── Attribute → Real Mechanics ───

/**
 * Speed → maxSpeed multiplier (1.0 at 50, up to ~1.3 at 100)
 * Used in race tick to scale progress per tick.
 */
export const getSpeedMultiplier = (speed: number): number => {
  const capped = Math.min(speed, STAT_CAPS.speed);
  return 0.7 + (capped / 100) * 0.6; // range: 0.7 – 1.3
};

/**
 * Acceleration → torque multiplier (1.0 at 50, up to ~1.25 at 100)
 * Used in race tick to scale acceleration component.
 */
export const getAccelerationMultiplier = (acceleration: number): number => {
  const capped = Math.min(acceleration, STAT_CAPS.acceleration);
  return 0.75 + (capped / 100) * 0.5; // range: 0.75 – 1.25
};

/**
 * Handling → NP efficiency bonus (0% at 0, up to 15% at 100)
 * Caps at 15% bonus — NEVER increases reward directly beyond this.
 */
export const getHandlingEfficiencyBonus = (handling: number): number => {
  const capped = Math.min(handling, STAT_CAPS.handling);
  return Math.min(capped / 100 * 0.15, 0.15); // max 15%
};

/**
 * Handling → variance reduction for race consistency.
 * Higher handling = more consistent results.
 */
export const getHandlingVariance = (handling: number): number => {
  const capped = Math.min(handling, STAT_CAPS.handling);
  const handlingFactor = capped / 100;
  return 0.4 * (1 - handlingFactor * 0.6); // max handling → 0.16 variance
};

/**
 * Durability → reduces engine damage multiplier (never increases rewards)
 * At 100 durability: 40% damage reduction. At 0: full damage.
 */
export const getDurabilityDamageReduction = (durability: number): number => {
  const capped = Math.min(durability, STAT_CAPS.durability);
  return 1 - (capped / 100) * 0.4; // 1.0 at 0 durability, 0.6 at 100
};

/**
 * Durability → reduces collision chance (never increases rewards)
 * At 100 durability: 30% less likely to collide.
 */
export const getDurabilityCollisionReduction = (durability: number): number => {
  const capped = Math.min(durability, STAT_CAPS.durability);
  return 1 - (capped / 100) * 0.3; // 1.0 at 0, 0.7 at 100
};

// ─── Dynamic Difficulty ───

const BASE_DIFFICULTY = 50;
const SCALING_FACTOR = 0.4; // Prevents linear explosion

/**
 * Generate opponent power based on player PowerScore.
 * Stronger player → stronger opponent (diminishing returns).
 */
export const getDynamicDifficulty = (playerPowerScore: number): number => {
  return BASE_DIFFICULTY + playerPowerScore * SCALING_FACTOR;
};

/**
 * Generate balanced opponent stats based on dynamic difficulty.
 * Returns base stat value with random spread.
 */
export const generateOpponentStats = (
  playerPowerScore: number,
  playerLevel: number
): { speed: number; acceleration: number; handling: number; health: number; level: number } => {
  const difficulty = getDynamicDifficulty(playerPowerScore);
  const spread = 10; // ±10 randomness
  const clamp = (v: number) => Math.max(20, Math.min(100, Math.round(v)));

  return {
    speed: clamp(difficulty + (Math.random() * spread * 2 - spread)),
    acceleration: clamp(difficulty + (Math.random() * spread * 2 - spread)),
    handling: clamp(difficulty + (Math.random() * spread * 2 - spread)),
    health: 100,
    level: Math.max(1, playerLevel + Math.floor(Math.random() * 3 - 1)),
  };
};

// ─── Reward Formula (Anti-Inflation) ───

const MAX_DAILY_NP_PER_PLAYER = 2000;

/**
 * Calculate reward using logarithmic growth instead of linear.
 * Reward = baseReward * log(PowerScore + 1) / log(100 + 1)
 * Normalized so at PowerScore=100, multiplier ≈ 1.0.
 * Handling adds up to 15% efficiency bonus.
 */
export const calculateReward = (
  baseReward: number,
  powerScore: number,
  handling: number
): number => {
  const logMultiplier = Math.log(powerScore + 1) / Math.log(101); // ~1.0 at PS=100
  const efficiencyBonus = 1 + getHandlingEfficiencyBonus(handling);
  return Math.round(baseReward * logMultiplier * efficiencyBonus);
};

/**
 * Check if player has exceeded daily NP cap.
 * Returns the allowed amount (0 if capped).
 */
export const applyDailyCap = (
  earnedToday: number,
  newReward: number
): number => {
  const remaining = Math.max(0, MAX_DAILY_NP_PER_PLAYER - earnedToday);
  return Math.min(newReward, remaining);
};

// ─── Anti-Farm (Winrate Penalty) ───

const ANTI_FARM_WINRATE_THRESHOLD = 0.7; // 70%
const ANTI_FARM_MAX_PENALTY = 0.3; // up to -30% reward
const ANTI_FARM_WINDOW = 20; // last N races

/**
 * Calculate anti-farm reward multiplier based on recent winrate.
 * If winrate > 70%: progressively reduce rewards (up to -30%).
 * Also returns a difficulty boost factor.
 */
export const getAntiFarmAdjustment = (
  recentWins: number,
  recentRaces: number
): { rewardMultiplier: number; difficultyBoost: number } => {
  if (recentRaces < 5) return { rewardMultiplier: 1.0, difficultyBoost: 0 };

  const winrate = recentWins / recentRaces;

  if (winrate <= ANTI_FARM_WINRATE_THRESHOLD) {
    return { rewardMultiplier: 1.0, difficultyBoost: 0 };
  }

  // Progressive penalty: linear from 70% to 100% winrate
  const excessWinrate = (winrate - ANTI_FARM_WINRATE_THRESHOLD) / (1 - ANTI_FARM_WINRATE_THRESHOLD);
  const penalty = excessWinrate * ANTI_FARM_MAX_PENALTY;
  const rewardMultiplier = Math.max(0.7, 1 - penalty);
  const difficultyBoost = excessWinrate * 15; // up to +15 opponent stats

  return { rewardMultiplier, difficultyBoost };
};

export const ANTI_FARM_WINDOW_SIZE = ANTI_FARM_WINDOW;
export const MAX_DAILY_NP = MAX_DAILY_NP_PER_PLAYER;

/**
 * Ensure progression never causes exponential emission.
 * Reward growth is always capped at log(PowerScore).
 * This is the master safety check.
 */
export const safeRewardMultiplier = (powerScore: number): number => {
  // log(PS+1) grows very slowly: log(101)≈4.6, log(51)≈3.9
  // Normalize so PS=50 → ~1.0, PS=100 → ~1.17
  const base = Math.log(51); // log(50+1)
  return Math.log(powerScore + 1) / base;
};
