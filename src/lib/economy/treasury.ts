/**
 * ============================================================
 * TREASURY (Reserva Estratégica)
 * ============================================================
 * Armazena 70% de cada transação deflacionária.
 * 
 * Regras:
 * - Não permite emissão infinita
 * - Apenas recebe transferências internas (via processTransaction)
 * - Saldo consultável para transparência
 * - Futuramente: governança para uso dos fundos
 * ============================================================
 */

import { fetchEconomyState } from "./supplyManager";

/**
 * Retorna o saldo atual do Treasury.
 * Somente leitura - o Treasury só recebe via processTransaction().
 */
export async function getTreasuryBalance(): Promise<number> {
  const state = await fetchEconomyState();
  return state.treasuryBalance;
}
