/**
 * ============================================================
 * REWARD POOL
 * ============================================================
 * Armazena tokens acumulados via taxa de 20% das transações.
 * Permite distribuição proporcional aos jogadores.
 * Bloqueia distribuição maior que o saldo disponível.
 * 
 * A distribuição é feita via RPC `distribute_reward` no Supabase,
 * garantindo que nunca distribui mais do que o pool tem.
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { fetchEconomyState } from "./supplyManager";

/**
 * Retorna o saldo atual do RewardPool.
 */
export async function getRewardPoolBalance(): Promise<number> {
  const state = await fetchEconomyState();
  return state.rewardPoolBalance;
}

/**
 * Distribui tokens do RewardPool para um jogador.
 * Bloqueia se o saldo do pool for insuficiente.
 * 
 * @param wallet - Wallet do jogador beneficiado
 * @param amount - Quantidade de NP a distribuir
 * @param reason - Motivo da distribuição (para log)
 * @returns true se distribuiu com sucesso, false se saldo insuficiente
 */
export async function distributeFromPool(
  wallet: string,
  amount: number,
  reason: string = "reward"
): Promise<boolean> {
  if (amount <= 0) return false;

  const { data, error } = await supabase.rpc("distribute_reward", {
    _wallet: wallet,
    _amount: amount,
    _reason: reason,
  });

  if (error) {
    console.error("[Economy] distributeFromPool error:", error);
    return false;
  }

  return data === true;
}
