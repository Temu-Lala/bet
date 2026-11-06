"use client";

import { useSyncExternalStore } from "react";

/**
 * A ~20-line external store implementing the same role as Zustand with no
 * dependency. Stores built on this are plain module singletons; components
 * subscribe through useStoreSelector.
 */
export interface Store<T extends object> {
  get(): T;
  set(partial: Partial<T> | ((state: T) => Partial<T>)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set: (partial) => {
      const next =
        typeof partial === "function"
          ? (partial as (s: T) => Partial<T>)(state)
          : partial;
      state = { ...state, ...next };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStoreSelector<T extends object, R>(
  store: Store<T>,
  selector: (state: T) => R,
): R {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}
