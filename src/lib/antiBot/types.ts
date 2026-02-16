/**
 * Anti-Bot Engine Types
 * 
 * Defines risk levels, player profiles, and security report structures.
 * Designed for future migration to server-side (Edge Function / microservice).
 */

/** Risk classification tiers */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Penalty tier from BehaviorScore DB function */
export type PenaltyTier = "none" | "warning" | "suspect" | "flagged" | "blocked";

/** Individual behavior dimension scores (0-100, 100 = human) */
export interface BehaviorDimensions {
  intervalScore: number;      // Regularity of race intervals
  variabilityScore: number;   // Duration variance between races
  winrateScore: number;       // Abnormal win rate detection
  patternScore: number;       // Repetitive NP earning patterns
}

/** Complete player risk profile */
export interface PlayerProfile {
  walletAddress: string;
  behaviorScore: number;       // Composite score (0-100)
  dimensions: BehaviorDimensions;
  riskLevel: RiskLevel;
  penaltyTier: PenaltyTier;
  rewardMultiplier: number;    // 0.0 - 1.0
  forcedCooldownSeconds: number;
  blockedUntil: string | null;
  flagged: boolean;
  dailyEarnings: number;       // Total NP earned today
  racesToday: number;          // Races played today
  lastCalculatedAt: string;
}

/** Result from AntiBotEngine.assessRisk() */
export interface RiskAssessment {
  riskLevel: RiskLevel;
  rewardMultiplier: number;    // Final multiplier after all adjustments
  blocked: boolean;
  reason: string;              // Human-readable reason for the assessment
  adjustedReward: number;      // Original reward * multiplier
  originalReward: number;
  penaltyTier: PenaltyTier;
  recommendations: string[];   // Actions for admin review
}

/** Security report for admin dashboard */
export interface SecurityReport {
  generatedAt: string;
  totalPlayers: number;
  suspiciousPlayers: number;
  flaggedPlayers: number;
  blockedPlayers: number;
  totalRewardsBlocked: number;    // NP that was NOT distributed due to penalties
  totalRewardsReduced: number;    // NP saved by multiplier reductions
  economicImpactAvoided: number;  // Total NP protected
  playerBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topSuspicious: PlayerProfile[];  // Top 10 most suspicious
  recentFlags: {
    wallet: string;
    score: number;
    tier: PenaltyTier;
    flaggedAt: string;
  }[];
}

/** Reward adjustment config — tunable without code changes */
export const RISK_CONFIG = {
  /** Score thresholds for risk classification */
  thresholds: {
    LOW: 70,       // Score >= 70 = LOW risk (human)
    MEDIUM: 50,    // Score 50-69 = MEDIUM risk (suspicious)
    HIGH: 30,      // Score 30-49 = HIGH risk (likely bot)
    CRITICAL: 0,   // Score < 30 = CRITICAL (confirmed bot)
  },

  /** Reward multipliers per risk level */
  multipliers: {
    LOW: 1.0,
    MEDIUM: 0.5,
    HIGH: 0.25,
    CRITICAL: 0.0,
  },

  /** Cooldown overrides per risk level (seconds) */
  cooldowns: {
    LOW: 120,
    MEDIUM: 300,
    HIGH: 600,
    CRITICAL: 3600,
  },

  /** Max daily NP per risk level (prevents grinding) */
  dailyCaps: {
    LOW: 2000,
    MEDIUM: 800,
    HIGH: 200,
    CRITICAL: 0,
  },
} as const;
