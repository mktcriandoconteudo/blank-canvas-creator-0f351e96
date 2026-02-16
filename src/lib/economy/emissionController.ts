/**
 * ============================================================
 * EMISSION CONTROLLER
 * ============================================================
 * Controla a emissão de novos NP com:
 * 
 * 1. Limite máximo de emissão por dia
 * 2. Redução progressiva ao longo do tempo (decay semanal)
 * 3. Ajuste dinâmico baseado em jogadores ativos
 * 4. Respeito ao hard cap (MAX_SUPPLY)
 * 
 * A emissão é processada via RPC `emit_tokens` no Supabase,
 * que garante atomicidade e controle de limites.
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";
import type { EmissionResult } from "./types";

/**
 * Emite tokens para um jogador, respeitando:
 * - Hard cap do supply total
 * - Limite diário de emissão (com decay progressivo)
 * - Bônus por jogadores ativos
 * 
 * @param wallet - Wallet do jogador
 * @param amount - Quantidade desejada de NP
 * @param reason - Motivo da emissão (ex: 'race_reward', 'daily_bonus')
 * @returns Resultado com quantidade efetivamente emitida
 */
export async function emitTokens(
  wallet: string,
  amount: number,
  reason: string = "race_reward"
): Promise<EmissionResult> {
  if (amount <= 0) {
    return { emitted: 0, reason: "invalid_amount" };
  }

  const { data, error } = await supabase.rpc("emit_tokens", {
    _amount: amount,
    _wallet: wallet,
    _reason: reason,
  });

  if (error) {
    console.error("[Economy] emitTokens error:", error);
    return { emitted: 0, reason: "rpc_error" };
  }

  const result = data as any;
  return {
    emitted: Number(result.emitted),
    dailyRemaining: result.daily_remaining != null ? Number(result.daily_remaining) : undefined,
    effectiveDailyLimit: result.effective_daily_limit != null ? Number(result.effective_daily_limit) : undefined,
    reason: result.reason ?? undefined,
  };
}
