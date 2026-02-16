/**
 * Security Report Generator
 * 
 * Generates comprehensive anti-bot reports for the admin dashboard.
 * Aggregates data from behavior_scores, daily_race_log, and economy_events.
 * 
 * Designed for future migration to scheduled Edge Function (cron job).
 */

import { supabase } from "@/integrations/supabase/client";
import { type SecurityReport, type PlayerProfile, type PenaltyTier, RISK_CONFIG } from "./types";
import { classifyRisk, getRewardMultiplier } from "./engine";

/**
 * Generate a comprehensive security report
 * 
 * This aggregates all anti-bot data into a single report for admin review.
 * Should be called from the Admin dashboard or via a scheduled function.
 * 
 * @returns SecurityReport with full breakdown of suspicious activity
 */
export async function generateSecurityReport(): Promise<SecurityReport> {
  // 1. Fetch all behavior scores
  const { data: scores } = await supabase
    .from("behavior_scores" as any)
    .select("*")
    .order("score", { ascending: true }) as any;

  const allScores = scores ?? [];

  // 2. Classify all players by risk level
  const breakdown = { low: 0, medium: 0, high: 0, critical: 0 };
  const suspicious: PlayerProfile[] = [];
  const flagged: { wallet: string; score: number; tier: PenaltyTier; flaggedAt: string }[] = [];

  for (const s of allScores) {
    const risk = classifyRisk(s.score);
    breakdown[risk.toLowerCase() as keyof typeof breakdown]++;

    if (s.flagged) {
      flagged.push({
        wallet: s.wallet_address,
        score: s.score,
        tier: (s.penalty_tier ?? "none") as PenaltyTier,
        flaggedAt: s.last_calculated_at,
      });
    }

    // Build profile for suspicious players (score < 70)
    if (s.score < RISK_CONFIG.thresholds.LOW) {
      suspicious.push({
        walletAddress: s.wallet_address,
        behaviorScore: s.score,
        dimensions: {
          intervalScore: s.interval_score,
          variabilityScore: s.variability_score,
          winrateScore: s.winrate_score,
          patternScore: s.pattern_score,
        },
        riskLevel: risk,
        penaltyTier: s.penalty_tier ?? "none",
        rewardMultiplier: s.reward_multiplier ?? 1.0,
        forcedCooldownSeconds: s.forced_cooldown_seconds ?? 120,
        blockedUntil: s.blocked_until,
        flagged: s.flagged,
        dailyEarnings: 0, // Will be enriched below
        racesToday: 0,
        lastCalculatedAt: s.last_calculated_at,
      });
    }
  }

  // 3. Calculate economic impact avoided
  // Sum up NP that was reduced/blocked due to penalties
  const { data: raceLog } = await supabase
    .from("daily_race_log" as any)
    .select("wallet_address, np_earned")
    .gte("raced_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as any;

  let totalRewardsBlocked = 0;
  let totalRewardsReduced = 0;

  // For each suspicious player, estimate how much was saved
  const suspiciousWallets = new Set(suspicious.map(p => p.walletAddress));
  for (const log of (raceLog ?? [])) {
    if (suspiciousWallets.has(log.wallet_address)) {
      const player = suspicious.find(p => p.walletAddress === log.wallet_address);
      if (!player) continue;

      const mult = getRewardMultiplier(player.riskLevel);
      const fullReward = log.np_earned; // What they actually earned (already reduced)
      // Estimate what they WOULD have earned at 100%
      const estimatedFull = mult > 0 ? Math.round(fullReward / mult) : fullReward + 100;
      const saved = estimatedFull - fullReward;

      if (mult === 0) {
        totalRewardsBlocked += estimatedFull;
      } else if (mult < 1) {
        totalRewardsReduced += saved;
      }
    }
  }

  // 4. Enrich suspicious profiles with daily earnings
  const today = new Date().toISOString().split("T")[0];
  for (const player of suspicious) {
    const todayLogs = (raceLog ?? []).filter(
      (r: any) => r.wallet_address === player.walletAddress && r.raced_at >= today
    );
    player.dailyEarnings = todayLogs.reduce((sum: number, r: any) => sum + (r.np_earned ?? 0), 0);
    player.racesToday = todayLogs.length;
  }

  // 5. Build report
  return {
    generatedAt: new Date().toISOString(),
    totalPlayers: allScores.length,
    suspiciousPlayers: breakdown.medium + breakdown.high + breakdown.critical,
    flaggedPlayers: flagged.length,
    blockedPlayers: breakdown.critical,
    totalRewardsBlocked,
    totalRewardsReduced,
    economicImpactAvoided: totalRewardsBlocked + totalRewardsReduced,
    playerBreakdown: breakdown,
    topSuspicious: suspicious.slice(0, 10), // Top 10 worst scores
    recentFlags: flagged.slice(0, 20),
  };
}
