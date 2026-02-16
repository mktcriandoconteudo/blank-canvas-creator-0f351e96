/**
 * ============================================================
 * SISTEMA ECONÔMICO DEFLACIONÁRIO - BARREL EXPORT
 * ============================================================
 * 
 * Arquitetura modular:
 * 
 *   constants.ts        → Hard cap, taxas, configurações
 *   types.ts             → Interfaces TypeScript
 *   supplyManager.ts     → Consultas de supply (total, circulante, queimado)
 *   transactionProcessor → Divisão automática: 10% burn, 20% reward, 70% treasury
 *   rewardPool.ts        → Pool de recompensas com distribuição controlada
 *   treasury.ts          → Reserva estratégica (somente recebe)
 *   emissionController   → Emissão com decay progressivo e hard cap
 *   reportGenerator.ts   → Relatório econômico e projeção de sustentabilidade
 * 
 * Sem Web3. Sem Metamask. Preparado para migração on-chain.
 * ============================================================
 */

// Constantes
export {
  MAX_SUPPLY,
  BURN_RATE_PERCENT,
  REWARD_POOL_RATE_PERCENT,
  TREASURY_RATE_PERCENT,
  DEFAULT_DAILY_EMISSION_LIMIT,
  DEFAULT_DECAY_RATE_PERCENT,
  MIN_DAILY_EMISSION,
  ECONOMY_EVENT_TYPES,
  SUSTAINABILITY_SCORES,
} from "./constants";

// Tipos
export type {
  EconomyState,
  TransactionResult,
  EmissionResult,
  EconomyReport,
  EconomyEvent,
} from "./types";

// Supply Manager
export {
  fetchEconomyState,
  getTotalSupply,
  getCirculatingSupply,
  getBurnedSupply,
} from "./supplyManager";

// Transaction Processor (deflacionário)
export {
  previewTransaction,
  processTransaction,
} from "./transactionProcessor";

// Reward Pool
export {
  getRewardPoolBalance,
  distributeFromPool,
} from "./rewardPool";

// Treasury
export { getTreasuryBalance } from "./treasury";

// Emission Controller
export { emitTokens } from "./emissionController";

// Report Generator
export { generateEconomyReport } from "./reportGenerator";
