/**
 * ============================================================
 * CONSTANTES DO SISTEMA ECONÔMICO DEFLACIONÁRIO
 * ============================================================
 * 
 * Hard Cap: 100.000.000 NP (Nitro Points)
 * 
 * Toda transação econômica é dividida:
 *   10% → Burn (removido permanentemente do supply)
 *   20% → RewardPool (distribuído aos jogadores)
 *   70% → Treasury (reserva estratégica)
 * 
 * Preparado para futura migração on-chain.
 * Sem dependência de Web3/Metamask.
 * ============================================================
 */

/** Supply máximo de NP que jamais existirá */
export const MAX_SUPPLY = 100_000_000;

/** Percentual queimado em cada transação */
export const BURN_RATE_PERCENT = 10;

/** Percentual destinado ao RewardPool */
export const REWARD_POOL_RATE_PERCENT = 20;

/** Percentual destinado ao Treasury */
export const TREASURY_RATE_PERCENT = 70;

/** Limite diário base de emissão (ajustável via emission_config) */
export const DEFAULT_DAILY_EMISSION_LIMIT = 50_000;

/** Redução semanal da emissão em % */
export const DEFAULT_DECAY_RATE_PERCENT = 2.0;

/** Piso mínimo de emissão diária */
export const MIN_DAILY_EMISSION = 5_000;

/** Tipos de eventos econômicos */
export const ECONOMY_EVENT_TYPES = {
  BURN: 'burn',
  MINT: 'mint',
  TRANSACTION: 'transaction',
  REWARD_DISTRIBUTE: 'reward_distribute',
  TREASURY_TRANSFER: 'treasury_transfer',
} as const;

/** Score de sustentabilidade */
export const SUSTAINABILITY_SCORES = {
  HIGH_DEFLATION: 'HIGH_DEFLATION',
  MODERATE_DEFLATION: 'MODERATE_DEFLATION',
  LOW_DEFLATION: 'LOW_DEFLATION',
  NO_DATA: 'NO_DATA',
} as const;
