/**
 * ============================================================
 * SUPPLY MANAGER
 * ============================================================
 * Gerencia o supply total, circulante e queimado.
 * Consulta o estado da economia no Supabase.
 * 
 * - getTotalSupply(): Supply máximo fixo (hard cap)
 * - getCirculatingSupply(): Minted - Burned
 * - getBurnedSupply(): Total queimado permanentemente
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { MAX_SUPPLY } from "./constants";
import type { EconomyState } from "./types";

/**
 * Busca o estado atual da economia no banco de dados.
 */
export async function fetchEconomyState(): Promise<EconomyState> {
  const { data, error } = await supabase
    .from("economy_state")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Retorna estado padrão se ainda não existir
    return {
      maxSupply: MAX_SUPPLY,
      totalMinted: 0,
      totalBurned: 0,
      rewardPoolBalance: 0,
      treasuryBalance: 0,
      dailyEmitted: 0,
      lastEmissionReset: new Date().toISOString(),
    };
  }

  return {
    maxSupply: Number(data.max_supply),
    totalMinted: Number(data.total_minted),
    totalBurned: Number(data.total_burned),
    rewardPoolBalance: Number(data.reward_pool_balance),
    treasuryBalance: Number(data.treasury_balance),
    dailyEmitted: Number(data.daily_emitted),
    lastEmissionReset: data.last_emission_reset,
  };
}

/** Retorna o hard cap máximo de supply */
export function getTotalSupply(): number {
  return MAX_SUPPLY;
}

/** Calcula o supply circulante (minted - burned) */
export function getCirculatingSupply(state: EconomyState): number {
  return state.totalMinted - state.totalBurned;
}

/** Retorna o total de tokens permanentemente queimados */
export function getBurnedSupply(state: EconomyState): number {
  return state.totalBurned;
}
