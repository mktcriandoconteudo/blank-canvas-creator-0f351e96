/**
 * Hook React para acessar o sistema econômico deflacionário.
 * Fornece estado, relatório e ações econômicas.
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchEconomyState,
  generateEconomyReport,
  getTotalSupply,
  getCirculatingSupply,
  getBurnedSupply,
  getRewardPoolBalance,
  getTreasuryBalance,
  previewTransaction,
} from "@/lib/economy";
import type { EconomyState, EconomyReport } from "@/lib/economy";

export const useEconomy = () => {
  const [state, setState] = useState<EconomyState | null>(null);
  const [report, setReport] = useState<EconomyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [economyState, economyReport] = await Promise.all([
        fetchEconomyState(),
        generateEconomyReport(),
      ]);
      setState(economyState);
      setReport(economyReport);
    } catch (e) {
      console.error("[useEconomy] refresh error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    state,
    report,
    loading,
    refresh,
    // Helpers síncronos
    totalSupply: getTotalSupply(),
    circulatingSupply: state ? getCirculatingSupply(state) : 0,
    burnedSupply: state ? getBurnedSupply(state) : 0,
    previewTransaction,
  };
};
