/**
 * ============================================================
 * ECONOMY REPORT GENERATOR
 * ============================================================
 * Gera relatório completo do estado econômico:
 * 
 * - Supply total, circulante e queimado
 * - Saldo do RewardPool e Treasury
 * - Taxa de burn e projeção de sustentabilidade
 * - Score de sustentabilidade deflacionária
 * 
 * Usa a RPC `get_economy_report` para cálculos consistentes.
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";
import type { EconomyReport } from "./types";

/**
 * Gera o relatório econômico completo.
 * Inclui projeção simples de sustentabilidade.
 */
export async function generateEconomyReport(): Promise<EconomyReport | null> {
  const { data, error } = await supabase.rpc("get_economy_report");

  if (error) {
    console.error("[Economy] generateEconomyReport error:", error);
    return null;
  }

  const r = data as any;
  return {
    maxSupply: Number(r.max_supply),
    totalMinted: Number(r.total_minted),
    totalBurned: Number(r.total_burned),
    circulatingSupply: Number(r.circulating_supply),
    rewardPoolBalance: Number(r.reward_pool_balance),
    treasuryBalance: Number(r.treasury_balance),
    burnRatePercent: Number(r.burn_rate_percent),
    avgDailyBurn: Number(r.avg_daily_burn),
    daysActive: Number(r.days_active),
    dailyEmissionLimit: Number(r.daily_emission_limit),
    dailyEmittedToday: Number(r.daily_emitted_today),
    projectedDaysToDepletion: Number(r.projected_days_to_depletion),
    sustainabilityScore: r.sustainability_score,
  };
}
