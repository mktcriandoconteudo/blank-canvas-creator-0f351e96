import { useState, useCallback, useSyncExternalStore } from "react";

const WALLET_FLAG_KEY = "turbonitro_wallet_enabled";

// Simple external store for cross-component reactivity
let listeners: Array<() => void> = [];
function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getWalletEnabled(): boolean {
  try {
    const val = localStorage.getItem(WALLET_FLAG_KEY);
    return val === null ? false : val === "true"; // disabled by default
  } catch {
    return false;
  }
}

export function useWalletEnabled() {
  const enabled = useSyncExternalStore(subscribe, getWalletEnabled);

  const setEnabled = useCallback((value: boolean) => {
    localStorage.setItem(WALLET_FLAG_KEY, String(value));
    emitChange();
  }, []);

  return { walletEnabled: enabled, setWalletEnabled: setEnabled };
}
