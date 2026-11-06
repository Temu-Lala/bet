"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { StoredCalculation } from "@/types/odds";
import {
  loadHistory,
  removeFromHistory,
  clearHistory,
  HISTORY_CHANGED_EVENT,
} from "@/lib/storage/calculation-storage";

/**
 * History hook: reads persisted analyses from browser storage through a
 * cached external store snapshot (useSyncExternalStore), so there is no
 * setState-in-effect cascade and cross-tab storage events propagate.
 */

const SERVER_SNAPSHOT: StoredCalculation[] = [];

let cache: StoredCalculation[] | null = null;
const listeners = new Set<() => void>();

function invalidate(): void {
  cache = null;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", invalidate);
  window.addEventListener(HISTORY_CHANGED_EVENT, invalidate);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", invalidate);
    window.removeEventListener(HISTORY_CHANGED_EVENT, invalidate);
  };
}

function getSnapshot(): StoredCalculation[] {
  if (cache === null) cache = loadHistory();
  return cache;
}

function getServerSnapshot(): StoredCalculation[] {
  return SERVER_SNAPSHOT;
}

export function useCalculationHistory() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const remove = useCallback((id: string) => {
    removeFromHistory(id); // the change event refreshes the cache
  }, []);

  const clear = useCallback(() => {
    clearHistory();
  }, []);

  const reload = useCallback(() => {
    invalidate();
  }, []);

  return {
    items,
    loaded: items !== SERVER_SNAPSHOT,
    remove,
    clear,
    reload,
  };
}
