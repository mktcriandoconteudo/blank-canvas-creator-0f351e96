/**
 * Hook React para gerenciar seguro do carro selecionado.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getActiveInsurance,
  purchaseInsurance,
  claimInsurance,
  InsurancePolicy,
  InsurancePlan,
  INSURANCE_PLANS,
  daysRemaining,
} from "@/lib/insurance";

export const useInsurance = (carId: string | null, wallet: string) => {
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!carId || !wallet) {
      setPolicy(null);
      return;
    }
    setLoading(true);
    try {
      const active = await getActiveInsurance(carId, wallet);
      setPolicy(active);
    } catch (e) {
      console.error("[useInsurance] refresh error:", e);
    } finally {
      setLoading(false);
    }
  }, [carId, wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchase = useCallback(
    async (plan: InsurancePlan) => {
      if (!carId || !wallet) return { success: false, error: "no_car" };
      const result = await purchaseInsurance(carId, wallet, plan);
      if (result.success) await refresh();
      return result;
    },
    [carId, wallet, refresh]
  );

  const claim = useCallback(
    async (claimType: string, originalCost: number) => {
      if (!carId || !wallet) return { success: false, error: "no_car", covered: 0, playerPays: originalCost };
      const result = await claimInsurance(carId, wallet, claimType, originalCost);
      if (result.success) await refresh();
      return result;
    },
    [carId, wallet, refresh]
  );

  return {
    policy,
    loading,
    refresh,
    purchase,
    claim,
    plans: INSURANCE_PLANS,
    isInsured: !!policy,
    daysLeft: policy ? daysRemaining(policy.expiresAt) : 0,
    claimsLeft: policy ? policy.maxClaims - policy.claimsUsed : 0,
  };
};
