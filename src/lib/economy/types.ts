/**
 * Tipos do sistema econômico deflacionário.
 * Preparado para futura serialização on-chain.
 */

export interface EconomyState {
  maxSupply: number;
  totalMinted: number;
  totalBurned: number;
  rewardPoolBalance: number;
  treasuryBalance: number;
  dailyEmitted: number;
  lastEmissionReset: string;
}

export interface TransactionResult {
  burned: number;
  toRewardPool: number;
  toTreasury: number;
  totalBurned: number;
  rewardPool: number;
  treasury: number;
}

export interface EmissionResult {
  emitted: number;
  dailyRemaining?: number;
  effectiveDailyLimit?: number;
  reason?: string;
}

export interface EconomyReport {
  maxSupply: number;
  totalMinted: number;
  totalBurned: number;
  circulatingSupply: number;
  rewardPoolBalance: number;
  treasuryBalance: number;
  burnRatePercent: number;
  avgDailyBurn: number;
  daysActive: number;
  dailyEmissionLimit: number;
  dailyEmittedToday: number;
  projectedDaysToDepletion: number;
  sustainabilityScore: string;
}

export interface EconomyEvent {
  id: string;
  eventType: string;
  amount: number;
  burnAmount: number;
  rewardAmount: number;
  treasuryAmount: number;
  wallet: string | null;
  description: string | null;
  createdAt: string;
}
