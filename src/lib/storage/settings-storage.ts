import { STORAGE_KEYS } from "@/lib/utils/constants";
import { DEFAULT_MARKET_WEIGHTS } from "@/lib/probability/markets/market-boundaries";
import type { MarketWeights } from "@/types/odds";
import type { StakingOptions } from "@/types/market";
import { DEFAULT_STAKING_OPTIONS } from "@/types/market";

/** Typed localStorage access for user settings and the odds draft. */

export interface AppSettings {
  theme: "light" | "dark";
  model: "POISSON" | "NEGATIVE_BINOMIAL";
  marginMethod: "MULTIPLICATIVE" | "ADDITIVE" | "POWER";
  maxGoals: number;
  precision: number;
  marketWeights: MarketWeights;
  /** Bankroll staking configuration for the Value & Risk screen. */
  staking: StakingOptions;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  model: "POISSON",
  marginMethod: "MULTIPLICATIVE",
  maxGoals: 15,
  precision: 2,
  marketWeights: { ...DEFAULT_MARKET_WEIGHTS },
  staking: { ...DEFAULT_STAKING_OPTIONS },
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // Nested objects need their own merge: old saved settings predate
      // marketWeights and must not lose half of the object.
      marketWeights: { ...DEFAULT_MARKET_WEIGHTS, ...(parsed.marketWeights ?? {}) },
      staking: { ...DEFAULT_STAKING_OPTIONS, ...(parsed.staking ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
