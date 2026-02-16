/**
 * ============================================================
 * TRANSACTION PROCESSOR (Deflacionário)
 * ============================================================
 * Toda função econômica deve passar por processTransaction().
 * 
 * Divisão automática:
 *   10% → Burn (reduz supply permanentemente)
 *   20% → RewardPool (acumulado para distribuição)
 *   70% → Treasury (reserva estratégica)
 * 
 * Usa a RPC `process_deflationary_transaction` no Supabase
 * para garantir atomicidade e consistência.
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { BURN_RATE_PERCENT, REWARD_POOL_RATE_PERCENT } from "./constants";
import type { TransactionResult } from "./types";

/**
 * Calcula a divisão da transação (preview local, sem persistir).
 * Útil para mostrar ao jogador antes de confirmar.
 */
export function previewTransaction(amount: number): {
  burn: number;
  reward: number;
  treasury: number;
} {
  const burn = Math.max(1, Math.floor((amount * BURN_RATE_PERCENT) / 100));
  const reward = Math.max(1, Math.floor((amount * REWARD_POOL_RATE_PERCENT) / 100));
  const treasury = amount - burn - reward;
  return { burn, reward, treasury };
}

/**
 * Processa uma transação deflacionária via RPC atômica.
 * Registra o evento no histórico econômico automaticamente.
 * 
 * @param amount - Quantidade de NP envolvida na transação
 * @param wallet - Wallet do jogador (opcional)
 * @param description - Descrição para o log econômico
 * @returns Resultado com valores distribuídos e totais atualizados
 */
export async function processTransaction(
  amount: number,
  wallet?: string,
  description: string = "transaction"
): Promise<TransactionResult | null> {
  if (amount <= 0) return null;

  const { data, error } = await supabase.rpc("process_deflationary_transaction", {
    _amount: amount,
    _wallet: wallet ?? null,
    _description: description,
  });

  if (error) {
    console.error("[Economy] processTransaction error:", error);
    return null;
  }

  const result = data as any;
  return {
    burned: Number(result.burned),
    toRewardPool: Number(result.to_reward_pool),
    toTreasury: Number(result.to_treasury),
    totalBurned: Number(result.total_burned),
    rewardPool: Number(result.reward_pool),
    treasury: Number(result.treasury),
  };
}
