/**
 * AntiBotEngine — Core anti-bot risk assessment module
 * 
 * Evaluates player behavior and adjusts rewards before distribution.
 * All analysis is based on data from Supabase (behavior_scores + daily_race_log).
 * 
 * Architecture: Client-side for now, designed for easy migration to Edge Function.
 * All DB calls use RPC functions — no raw SQL.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  type RiskLevel,
  type RiskAssessment,
  type PlayerProfile,
  type PenaltyTier,
  RISK_CONFIG,
} from "./types";

/**
 * Classify risk level from behavior score
 * Pure function — no side effects, easy to test
 */
export function classifyRisk(score: number): RiskLevel {
  if (score >= RISK_CONFIG.thresholds.LOW) return "LOW";
  if (score >= RISK_CONFIG.thresholds.MEDIUM) return "MEDIUM";
  if (score >= RISK_CONFIG.thresholds.HIGH) return "HIGH";
  return "CRITICAL";
}

/**
 * Get reward multiplier for a risk level
 * Pure function — deterministic output
 */
export function getRewardMultiplier(riskLevel: RiskLevel): number {
  return RISK_CONFIG.multipliers[riskLevel];
}

/**
 * Get daily NP cap for a risk level
 */
export function getDailyCap(riskLevel: RiskLevel): number {
  return RISK_CONFIG.dailyCaps[riskLevel];
}

/**
 * Fetch player's daily earnings from race log
 * Used to enforce daily caps per risk level
 */
async function getDailyEarnings(wallet: string): Promise<{ totalNP: number; raceCount: number }> {
  const { data } = await supabase
    .from("daily_race_log" as any)
    .select("np_earned")
    .eq("wallet_address", wallet)
    .gte("raced_at", new Date().toISOString().split("T")[0]) as any;

  const rows = data ?? [];
  return {
    totalNP: rows.reduce((sum: number, r: any) => sum + (r.np_earned ?? 0), 0),
    raceCount: rows.length,
  };
}

/**
 * Fetch or calculate the player's behavior profile
 * Calls the DB function calculate_behavior_score which handles all analysis
 */
export async function getPlayerProfile(wallet: string): Promise<PlayerProfile> {
  // Trigger fresh calculation
  const { data: scoreData } = await supabase.rpc("calculate_behavior_score" as any, {
    _wallet: wallet,
  });

  const score = scoreData?.score ?? 100;
  const riskLevel = classifyRisk(score);
  const daily = await getDailyEarnings(wallet);

  return {
    walletAddress: wallet,
    behaviorScore: score,
    dimensions: {
      intervalScore: scoreData?.interval_score ?? 100,
      variabilityScore: scoreData?.variability_score ?? 100,
      winrateScore: scoreData?.winrate_score ?? 100,
      patternScore: scoreData?.pattern_score ?? 100,
    },
    riskLevel,
    penaltyTier: (scoreData?.penalty_tier ?? "none") as PenaltyTier,
    rewardMultiplier: scoreData?.reward_multiplier ?? 1.0,
    forcedCooldownSeconds: scoreData?.forced_cooldown_seconds ?? 120,
    blockedUntil: scoreData?.blocked_until ?? null,
    flagged: scoreData?.flagged ?? false,
    dailyEarnings: daily.totalNP,
    racesToday: daily.raceCount,
    lastCalculatedAt: new Date().toISOString(),
  };
}

/**
 * Core assessment: Should this player receive a reward? How much?
 * 
 * This is the main entry point before any reward distribution.
 * Call this BEFORE emitting tokens or crediting NP.
 * 
 * @param wallet - Player's wallet address
 * @param baseReward - The raw reward amount before any adjustments
 * @param source - Reward source (e.g., "race_win", "race_loss")
 * @returns RiskAssessment with adjusted reward and recommendations
 */
export async function assessRisk(
  wallet: string,
  baseReward: number,
  _source: string = "race"
): Promise<RiskAssessment> {
  // Step 1: Get fresh behavior profile
  const profile = await getPlayerProfile(wallet);

  // Step 2: Check if blocked
  if (profile.blockedUntil && new Date(profile.blockedUntil) > new Date()) {
    return {
      riskLevel: "CRITICAL",
      rewardMultiplier: 0,
      blocked: true,
      reason: `Bloqueado até ${new Date(profile.blockedUntil).toLocaleString("pt-BR")}`,
      adjustedReward: 0,
      originalReward: baseReward,
      penaltyTier: profile.penaltyTier,
      recommendations: ["Investigar atividade do jogador", "Verificar padrões de corrida"],
    };
  }

  // Step 3: Apply risk-based multiplier
  const riskMultiplier = getRewardMultiplier(profile.riskLevel);

  // Step 4: Check daily cap
  const dailyCap = getDailyCap(profile.riskLevel);
  const remainingCap = Math.max(0, dailyCap - profile.dailyEarnings);
  const afterMultiplier = Math.round(baseReward * riskMultiplier);
  const adjustedReward = Math.min(afterMultiplier, remainingCap);

  // Step 5: Build recommendations
  const recommendations: string[] = [];
  if (profile.riskLevel === "MEDIUM") {
    recommendations.push("Monitorar — comportamento levemente irregular");
  }
  if (profile.riskLevel === "HIGH") {
    recommendations.push("Investigar — alta probabilidade de automação");
    recommendations.push("Considerar bloqueio manual se persistir");
  }
  if (profile.riskLevel === "CRITICAL") {
    recommendations.push("Bloqueio automático aplicado");
    recommendations.push("Verificar IP e padrões de dispositivo");
  }
  if (profile.dailyEarnings >= dailyCap * 0.8) {
    recommendations.push(`Próximo do cap diário: ${profile.dailyEarnings}/${dailyCap} NP`);
  }
  if (profile.dimensions.intervalScore < 30) {
    recommendations.push("Intervalo entre corridas muito regular — padrão de bot");
  }
  if (profile.dimensions.winrateScore < 30) {
    recommendations.push("Taxa de vitória anormalmente alta");
  }

  // Step 6: Determine reason
  let reason = "Jogador verificado ✓";
  if (profile.riskLevel === "MEDIUM") reason = "Recompensa reduzida: comportamento suspeito";
  if (profile.riskLevel === "HIGH") reason = "Recompensa mínima: alta probabilidade de bot";
  if (profile.riskLevel === "CRITICAL") reason = "Recompensa bloqueada: atividade automatizada";
  if (adjustedReward === 0 && remainingCap === 0) reason = "Cap diário atingido";

  return {
    riskLevel: profile.riskLevel,
    rewardMultiplier: riskMultiplier,
    blocked: adjustedReward === 0 && profile.riskLevel === "CRITICAL",
    reason,
    adjustedReward,
    originalReward: baseReward,
    penaltyTier: profile.penaltyTier,
    recommendations,
  };
}

/**
 * Quick check: Is the player allowed to race right now?
 * Lightweight version — doesn't recalculate full behavior score.
 * Uses cached data from behavior_scores table.
 */
export async function canPlayerRace(wallet: string): Promise<{
  allowed: boolean;
  reason: string;
  waitSeconds?: number;
  penaltyTier: PenaltyTier;
}> {
  const { data } = await supabase.rpc("check_behavior_block" as any, {
    _wallet: wallet,
  });

  if (data?.blocked) {
    return {
      allowed: false,
      reason: `Bloqueado: ${data.penalty_tier}`,
      waitSeconds: data.wait_seconds ?? 0,
      penaltyTier: data.penalty_tier ?? "blocked",
    };
  }

  return {
    allowed: true,
    reason: "OK",
    penaltyTier: data?.penalty_tier ?? "none",
  };
}
