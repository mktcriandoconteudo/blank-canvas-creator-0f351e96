import { useState, useEffect, useCallback } from "react";
import {
  GameState,
  loadGameStateFromSupabase,
  getSelectedCar,
  addXpToCar,
  distributePoint,
  repairCar,
  changeOil,
  saveUserToSupabase,
  saveCarToSupabase,
} from "@/lib/gameState";
import { useAuth } from "@/hooks/useAuth";

export const useGameState = () => {
  const { user } = useAuth();
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.walletAddress) return;
    setLoading(true);
    loadGameStateFromSupabase(user.walletAddress).then((loaded) => {
      setState(loaded);
      setLoading(false);
    });
  }, [user?.walletAddress]);

  const selectedCar = state ? getSelectedCar(state) : undefined;

  const finishRace = useCallback(
    (won: boolean, rewardMultiplier: number = 1.0, raceNumber: number = 1) => {
      if (!state?.selectedCarId) return { leveledUp: false, newLevel: 0, freeNP: 0, lockedNP: 0 };
      const { newState, leveledUp, newLevel, freeNP, lockedNP } = addXpToCar(state, state.selectedCarId, won, rewardMultiplier, raceNumber);
      setState(newState);
      return { leveledUp, newLevel, freeNP, lockedNP };
    },
    [state]
  );

  const addPoint = useCallback(
    (attribute: "speed" | "acceleration" | "handling" | "durability") => {
      if (!state?.selectedCarId) return;
      const newState = distributePoint(state, state.selectedCarId, attribute);
      setState(newState);
    },
    [state]
  );

  const repair = useCallback(
    (cost: number) => {
      if (!state?.selectedCarId) return false;
      const newState = repairCar(state, state.selectedCarId, cost);
      if (!newState) return false;
      setState(newState);
      return true;
    },
    [state]
  );

  const oilChange = useCallback(
    (cost: number) => {
      if (!state?.selectedCarId) return false;
      const newState = changeOil(state, state.selectedCarId, cost);
      if (!newState) return false;
      setState(newState);
      return true;
    },
    [state]
  );

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      // Persist changes to Supabase
      saveUserToSupabase(next.walletAddress, next.nitroPoints, next.fuelTanks);
      // Persist car changes
      const prevCar = prev.cars.find((c) => c.id === prev.selectedCarId);
      const nextCar = next.cars.find((c) => c.id === next.selectedCarId);
      if (nextCar && JSON.stringify(prevCar) !== JSON.stringify(nextCar)) {
        saveCarToSupabase(nextCar);
      }
      return next;
    });
  }, []);

  const selectCar = useCallback((carId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      localStorage.setItem("selectedCarId", carId);
      return { ...prev, selectedCarId: carId };
    });
  }, []);

  return {
    state: state ?? {
      cars: [],
      selectedCarId: null,
      nitroPoints: 0,
      fuelTanks: 0,
      lastFuelRefill: "",
      walletAddress: user?.walletAddress ?? "",
    },
    selectedCar,
    finishRace,
    addPoint,
    repair,
    oilChange,
    updateState,
    selectCar,
    loading,
  };
};
