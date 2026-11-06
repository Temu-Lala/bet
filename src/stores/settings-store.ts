"use client";

import { createStore } from "@/lib/utils/store";
import {
  loadSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/storage/settings-storage";

/**
 * Settings store: theme, default model, max goals, margin method and
 * display precision. Persisted to browser storage on every change.
 */

export const settingsStore = createStore<AppSettings>({ ...loadSettings() });

let hydrated = false;

export function hydrateSettings(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const stored = loadSettings();
  settingsStore.set(stored);
  applyTheme(stored.theme);
}

export function updateSettings(partial: Partial<AppSettings>): void {
  const next = { ...settingsStore.get(), ...partial };
  settingsStore.set(next);
  saveSettings(next);
  if (partial.theme !== undefined) applyTheme(next.theme);
}

export function applyTheme(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
