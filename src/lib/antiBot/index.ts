/**
 * Anti-Bot Engine — Public API
 * 
 * Central module for bot detection, risk assessment, and security reporting.
 * 
 * Usage:
 *   import { assessRisk, canPlayerRace, generateSecurityReport } from "@/lib/antiBot";
 * 
 * Integration points:
 *   1. Before race: canPlayerRace(wallet) → check if allowed
 *   2. Before reward: assessRisk(wallet, baseReward) → get adjusted reward
 *   3. Admin panel: generateSecurityReport() → full security overview
 * 
 * Future: Migrate engine.ts to Edge Function for server-side enforcement.
 */

export { assessRisk, canPlayerRace, getPlayerProfile, classifyRisk } from "./engine";
export { generateSecurityReport } from "./reportGenerator";
export { RISK_CONFIG } from "./types";
export type {
  RiskLevel,
  RiskAssessment,
  PlayerProfile,
  PenaltyTier,
  SecurityReport,
  BehaviorDimensions,
} from "./types";
