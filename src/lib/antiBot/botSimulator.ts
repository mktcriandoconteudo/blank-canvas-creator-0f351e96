/**
 * Bot Attack Simulator
 * 
 * Simulates 1,000 bot accounts with varying behavior profiles
 * and runs them through the AntiBotEngine to demonstrate detection efficacy.
 * 
 * 100% client-side — no DB calls. Uses pure functions from engine.ts.
 */

import { classifyRisk, getRewardMultiplier, getDailyCap } from "./engine";
import { type RiskLevel, RISK_CONFIG } from "./types";

/* ── Types ── */

export interface SimulatedBot {
  id: number;
  name: string;
  type: "HUMAN" | "NAIVE_BOT" | "SMART_BOT" | "FARM_BOT" | "HYBRID";
  behaviorScore: number;
  riskLevel: RiskLevel;
  dimensions: {
    intervalScore: number;
    variabilityScore: number;
    winrateScore: number;
    patternScore: number;
  };
  racesAttempted: number;
  racesAllowed: number;
  npRequested: number;
  npReceived: number;
  npBlocked: number;
  blocked: boolean;
  rewardMultiplier: number;
  dailyCap: number;
}

export interface SimulationReport {
  totalBots: number;
  totalHumans: number;
  totalDetected: number;
  detectionRate: number;             // % of bots caught
  falsePositives: number;            // Humans incorrectly flagged
  falsePositiveRate: number;         // % of humans flagged
  totalNPRequested: number;
  totalNPDistributed: number;
  totalNPBlocked: number;
  economicProtection: number;        // % of bot NP blocked
  breakdown: {
    type: string;
    count: number;
    detected: number;
    detectionRate: number;
    avgScore: number;
    npBlocked: number;
  }[];
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  bots: SimulatedBot[];
  duration: number;                  // ms
}

/* ── Random helpers ── */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/* ── Bot profile generators ── */

/** Human players: natural behavior, high scores */
function generateHuman(): Omit<SimulatedBot, "riskLevel" | "rewardMultiplier" | "dailyCap" | "blocked" | "npReceived" | "npBlocked"> {
  const interval = rand(70, 100);
  const variability = rand(65, 100);
  const winrate = rand(60, 100);
  const pattern = rand(70, 100);
  const score = clamp(Math.round((interval + variability + winrate + pattern) / 4), 0, 100);
  const races = rand(3, 15);
  return {
    id: 0, name: "", type: "HUMAN",
    behaviorScore: score,
    dimensions: { intervalScore: interval, variabilityScore: variability, winrateScore: winrate, patternScore: pattern },
    racesAttempted: races, racesAllowed: races,
    npRequested: races * rand(20, 80),
  };
}

/** Naive bot: fixed intervals, high win rate, repetitive patterns */
function generateNaiveBot(): Omit<SimulatedBot, "riskLevel" | "rewardMultiplier" | "dailyCap" | "blocked" | "npReceived" | "npBlocked"> {
  const interval = rand(0, 15);    // Very regular
  const variability = rand(0, 10); // Almost no variance
  const winrate = rand(5, 25);     // Suspiciously high
  const pattern = rand(0, 20);     // Repetitive
  const score = clamp(Math.round((interval + variability + winrate + pattern) / 4), 0, 100);
  const races = rand(40, 100);
  return {
    id: 0, name: "", type: "NAIVE_BOT",
    behaviorScore: score,
    dimensions: { intervalScore: interval, variabilityScore: variability, winrateScore: winrate, patternScore: pattern },
    racesAttempted: races, racesAllowed: 0,
    npRequested: races * rand(30, 60),
  };
}

/** Smart bot: tries to mimic human behavior but still detectable */
function generateSmartBot(): Omit<SimulatedBot, "riskLevel" | "rewardMultiplier" | "dailyCap" | "blocked" | "npReceived" | "npBlocked"> {
  const interval = rand(25, 55);
  const variability = rand(20, 50);
  const winrate = rand(30, 55);
  const pattern = rand(25, 50);
  const score = clamp(Math.round((interval + variability + winrate + pattern) / 4), 0, 100);
  const races = rand(20, 50);
  return {
    id: 0, name: "", type: "SMART_BOT",
    behaviorScore: score,
    dimensions: { intervalScore: interval, variabilityScore: variability, winrateScore: winrate, patternScore: pattern },
    racesAttempted: races, racesAllowed: 0,
    npRequested: races * rand(25, 70),
  };
}

/** Farm bot: focuses on volume, doesn't care about detection */
function generateFarmBot(): Omit<SimulatedBot, "riskLevel" | "rewardMultiplier" | "dailyCap" | "blocked" | "npReceived" | "npBlocked"> {
  const interval = rand(0, 10);
  const variability = rand(0, 5);
  const winrate = rand(10, 30);
  const pattern = rand(0, 10);
  const score = clamp(Math.round((interval + variability + winrate + pattern) / 4), 0, 100);
  const races = rand(80, 200);
  return {
    id: 0, name: "", type: "FARM_BOT",
    behaviorScore: score,
    dimensions: { intervalScore: interval, variabilityScore: variability, winrateScore: winrate, patternScore: pattern },
    racesAttempted: races, racesAllowed: 0,
    npRequested: races * rand(20, 40),
  };
}

/** Hybrid: alternates between human and bot behavior */
function generateHybridBot(): Omit<SimulatedBot, "riskLevel" | "rewardMultiplier" | "dailyCap" | "blocked" | "npReceived" | "npBlocked"> {
  const interval = rand(35, 65);
  const variability = rand(30, 60);
  const winrate = rand(40, 70);
  const pattern = rand(35, 65);
  const score = clamp(Math.round((interval + variability + winrate + pattern) / 4), 0, 100);
  const races = rand(10, 30);
  return {
    id: 0, name: "", type: "HYBRID",
    behaviorScore: score,
    dimensions: { intervalScore: interval, variabilityScore: variability, winrateScore: winrate, patternScore: pattern },
    racesAttempted: races, racesAllowed: 0,
    npRequested: races * rand(25, 60),
  };
}

const BOT_NAMES_PREFIX = ["Shadow", "Auto", "Farm", "Speed", "Turbo", "Nitro", "Blitz", "Grind", "Rush", "Phantom"];
const BOT_NAMES_SUFFIX = ["Runner", "Bot", "Script", "X", "Pro", "King", "Master", "3000", "AI", "Machine"];

/* ── Main simulation ── */

export function simulateBotAttack(
  totalBots: number = 1000,
  humanRatio: number = 0.20 // 20% are real humans to test false positives
): SimulationReport {
  const start = performance.now();

  const numHumans = Math.round(totalBots * humanRatio);
  const numBots = totalBots - numHumans;

  // Distribute bots across types
  const numNaive = Math.round(numBots * 0.35);
  const numFarm = Math.round(numBots * 0.25);
  const numSmart = Math.round(numBots * 0.25);
  const numHybrid = numBots - numNaive - numFarm - numSmart;

  const bots: SimulatedBot[] = [];
  let id = 1;

  const finalize = (raw: ReturnType<typeof generateHuman>, idx: number): SimulatedBot => {
    const riskLevel = classifyRisk(raw.behaviorScore);
    const mult = getRewardMultiplier(riskLevel);
    const cap = getDailyCap(riskLevel);
    const npAfterMult = Math.round(raw.npRequested * mult);
    const npReceived = Math.min(npAfterMult, cap);
    const npBlocked = raw.npRequested - npReceived;
    const blocked = riskLevel === "CRITICAL";
    const prefix = BOT_NAMES_PREFIX[idx % BOT_NAMES_PREFIX.length];
    const suffix = BOT_NAMES_SUFFIX[Math.floor(idx / BOT_NAMES_PREFIX.length) % BOT_NAMES_SUFFIX.length];

    return {
      ...raw,
      id: idx,
      name: raw.type === "HUMAN" ? `Player_${idx}` : `${prefix}${suffix}_${idx}`,
      riskLevel,
      rewardMultiplier: mult,
      dailyCap: cap,
      blocked,
      npReceived,
      npBlocked,
      racesAllowed: blocked ? 0 : raw.racesAttempted,
    };
  };

  // Generate humans
  for (let i = 0; i < numHumans; i++) { bots.push(finalize(generateHuman(), id++)); }
  // Generate bots
  for (let i = 0; i < numNaive; i++) { bots.push(finalize(generateNaiveBot(), id++)); }
  for (let i = 0; i < numFarm; i++) { bots.push(finalize(generateFarmBot(), id++)); }
  for (let i = 0; i < numSmart; i++) { bots.push(finalize(generateSmartBot(), id++)); }
  for (let i = 0; i < numHybrid; i++) { bots.push(finalize(generateHybridBot(), id++)); }

  // Calculate stats
  const humans = bots.filter(b => b.type === "HUMAN");
  const botAccounts = bots.filter(b => b.type !== "HUMAN");
  const detectedBots = botAccounts.filter(b => b.riskLevel !== "LOW");
  const falsePositives = humans.filter(h => h.riskLevel !== "LOW");

  const riskDist = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  bots.forEach(b => riskDist[b.riskLevel]++);

  // Breakdown by type
  const types = ["HUMAN", "NAIVE_BOT", "SMART_BOT", "FARM_BOT", "HYBRID"] as const;
  const breakdown = types.map(type => {
    const group = bots.filter(b => b.type === type);
    const detected = group.filter(b => b.riskLevel !== "LOW");
    return {
      type,
      count: group.length,
      detected: detected.length,
      detectionRate: group.length > 0 ? (detected.length / group.length) * 100 : 0,
      avgScore: group.length > 0 ? Math.round(group.reduce((s, b) => s + b.behaviorScore, 0) / group.length) : 0,
      npBlocked: group.reduce((s, b) => s + b.npBlocked, 0),
    };
  });

  const totalNPRequested = bots.reduce((s, b) => s + b.npRequested, 0);
  const totalNPDistributed = bots.reduce((s, b) => s + b.npReceived, 0);
  const totalNPBlocked = bots.reduce((s, b) => s + b.npBlocked, 0);
  const botNPRequested = botAccounts.reduce((s, b) => s + b.npRequested, 0);
  const botNPBlocked = botAccounts.reduce((s, b) => s + b.npBlocked, 0);

  return {
    totalBots: botAccounts.length,
    totalHumans: humans.length,
    totalDetected: detectedBots.length,
    detectionRate: botAccounts.length > 0 ? (detectedBots.length / botAccounts.length) * 100 : 0,
    falsePositives: falsePositives.length,
    falsePositiveRate: humans.length > 0 ? (falsePositives.length / humans.length) * 100 : 0,
    totalNPRequested,
    totalNPDistributed,
    totalNPBlocked,
    economicProtection: botNPRequested > 0 ? (botNPBlocked / botNPRequested) * 100 : 0,
    breakdown,
    riskDistribution: riskDist,
    bots: bots.sort((a, b) => a.behaviorScore - b.behaviorScore),
    duration: Math.round(performance.now() - start),
  };
}
