/**
 * ============================================================
 * SISTEMA DE SEGURO DE CARRO
 * ============================================================
 * 
 * Planos disponíveis:
 * 
 *   🟢 Básico    → 30% cobertura, 3 sinistros, 30 corridas, 7 dias  → 200 NP
 *   🔵 Standard  → 60% cobertura, 5 sinistros, 60 corridas, 15 dias → 500 NP
 *   🟣 Premium   → 100% cobertura, 10 sinistros, 100 corridas, 30 dias → 1200 NP
 * 
 * Funciona como seguro real:
 * - Paga a apólice (prêmio) antecipadamente
 * - Ao precisar de reparo/troca de óleo, aciona o seguro
 * - O seguro cobre % do custo; jogador paga o resto
 * - Apólice expira por tempo, corridas ou sinistros
 * - Pagamento passa pelo sistema deflacionário
 * 
 * Preparado para futura migração on-chain.
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { processTransaction } from "@/lib/economy";

/** Definição dos planos de seguro */
export interface InsurancePlan {
  id: string;
  name: string;
  emoji: string;
  coveragePercent: number;
  premium: number;          // Custo em NP
  maxClaims: number;        // Máximo de acionamentos
  racesLimit: number;       // Validade em corridas
  durationDays: number;     // Validade em dias
  color: string;            // Cor do plano para UI
  description: string;
}

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: "basic",
    name: "Básico",
    emoji: "🟢",
    coveragePercent: 30,
    premium: 200,
    maxClaims: 3,
    racesLimit: 30,
    durationDays: 7,
    color: "emerald",
    description: "Cobertura essencial: 30% dos custos de reparo, válido por 7 dias ou 30 corridas.",
  },
  {
    id: "standard",
    name: "Standard",
    emoji: "🔵",
    coveragePercent: 60,
    premium: 500,
    maxClaims: 5,
    racesLimit: 60,
    durationDays: 15,
    color: "blue",
    description: "Cobertura intermediária: 60% dos custos, válido por 15 dias ou 60 corridas.",
  },
  {
    id: "premium",
    name: "Premium",
    emoji: "🟣",
    coveragePercent: 100,
    premium: 1200,
    maxClaims: 10,
    racesLimit: 100,
    durationDays: 30,
    color: "purple",
    description: "Cobertura total: 100% dos custos, válido por 30 dias ou 100 corridas.",
  },
];

/** Dados de uma apólice ativa */
export interface InsurancePolicy {
  id: string;
  carId: string;
  planType: string;
  coveragePercent: number;
  premiumPaid: number;
  maxClaims: number;
  claimsUsed: number;
  racesRemaining: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

/** Resultado de um sinistro */
export interface ClaimResult {
  success: boolean;
  error?: string;
  covered: number;
  playerPays: number;
  claimsRemaining?: number;
  plan?: string;
}

/**
 * Busca a apólice ativa de um carro.
 */
export async function getActiveInsurance(carId: string, wallet: string): Promise<InsurancePolicy | null> {
  const { data, error } = await supabase
    .from("car_insurance")
    .select("*")
    .eq("car_id", carId)
    .eq("owner_wallet", wallet)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("coverage_percent", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    carId: data.car_id,
    planType: data.plan_type,
    coveragePercent: data.coverage_percent,
    premiumPaid: Number(data.premium_paid),
    maxClaims: data.max_claims,
    claimsUsed: data.claims_used,
    racesRemaining: data.races_remaining,
    expiresAt: data.expires_at,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

/**
 * Contrata um plano de seguro para o carro.
 * O pagamento passa pelo sistema deflacionário (10% burn, 20% pool, 70% treasury).
 */
export async function purchaseInsurance(
  carId: string,
  wallet: string,
  plan: InsurancePlan
): Promise<{ success: boolean; error?: string; insuranceId?: string }> {
  const { data, error } = await supabase.rpc("purchase_insurance", {
    _car_id: carId,
    _wallet: wallet,
    _plan_type: plan.id,
    _coverage_percent: plan.coveragePercent,
    _premium: plan.premium,
    _max_claims: plan.maxClaims,
    _races_limit: plan.racesLimit,
    _duration_days: plan.durationDays,
  });

  if (error) {
    console.error("[Insurance] purchase error:", error);
    return { success: false, error: "rpc_error" };
  }

  const result = data as any;

  if (result.success) {
    // Processar transação deflacionária com o valor do prêmio
    processTransaction(plan.premium, wallet, `insurance_${plan.id}`).catch(() => {});
  }

  return {
    success: result.success,
    error: result.error,
    insuranceId: result.insurance_id,
  };
}

/**
 * Aciona o seguro para cobrir um custo de reparo/manutenção.
 * Retorna quanto o seguro cobre e quanto o jogador paga.
 */
export async function claimInsurance(
  carId: string,
  wallet: string,
  claimType: string,
  originalCost: number
): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc("claim_insurance", {
    _car_id: carId,
    _wallet: wallet,
    _claim_type: claimType,
    _original_cost: originalCost,
  });

  if (error) {
    console.error("[Insurance] claim error:", error);
    return { success: false, error: "rpc_error", covered: 0, playerPays: originalCost };
  }

  const result = data as any;
  return {
    success: result.success,
    error: result.error,
    covered: Number(result.covered),
    playerPays: Number(result.player_pays),
    claimsRemaining: result.claims_remaining,
    plan: result.plan,
  };
}

/**
 * Retorna o plano de seguro pelo ID.
 */
export function getPlanById(planId: string): InsurancePlan | undefined {
  return INSURANCE_PLANS.find((p) => p.id === planId);
}

/**
 * Calcula dias restantes de uma apólice.
 */
export function daysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
