import { useState, useEffect, useCallback } from "react";
import {
  GameState,
  loadGameState,
  saveGameState,
  getSelectedCar,
  addXpToCar,
  distributePoint,
  repairCar,
  refuelDaily,
  CarData,
} from "@/lib/gameState";

export const useGameState = () => {
  const [state, setState] = useState<GameState>(() => {
    const loaded = loadGameState();
    return refuelDaily(loaded);
  });

  const selectedCar = getSelectedCar(state);

  const finishRace = useCallback(
    (won: boolean) => {
      if (!state.selectedCarId) return { leveledUp: false, newLevel: 0 };
      const { newState, leveledUp, newLevel } = addXpToCar(state, state.selectedCarId, won);
      setState(newState);
      return { leveledUp, newLevel };
    },
    [state]
  );

  const addPoint = useCallback(
    (attribute: "speed" | "acceleration" | "handling" | "durability") => {
      if (!state.selectedCarId) return;
      const newState = distributePoint(state, state.selectedCarId, attribute);
      setState(newState);
    },
    [state]
  );

  const repair = useCallback(
    (cost: number) => {
      if (!state.selectedCarId) return false;
      const newState = repairCar(state, state.selectedCarId, cost);
      if (!newState) return false;
      setState(newState);
      return true;
    },
    [state]
  );

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState((prev) => {
      const next = updater(prev);
      saveGameState(next);
      return next;
    });
  }, []);

  return {
    state,
    selectedCar,
    finishRace,
    addPoint,
    repair,
    updateState,
  };
};
