import { APP_NAME, DEFAULT_MAX_GOALS, DEFAULT_MARGIN_METHOD, DEFAULT_MODEL } from "@/lib/utils/constants";
import { DEFAULT_MARKET_WEIGHTS } from "@/lib/probability/markets/market-boundaries";
import type { CalculationOptions } from "@/types/odds";

export const APP_CONFIG = {
  name: APP_NAME,
  version: "0.1.0",
  tagline: "Bookmaker odds in. Independent probability analysis out.",
} as const;

export const DEFAULT_CALCULATION_OPTIONS: CalculationOptions = {
  model: DEFAULT_MODEL,
  marginMethod: DEFAULT_MARGIN_METHOD,
  maxGoals: DEFAULT_MAX_GOALS,
  marketWeights: { ...DEFAULT_MARKET_WEIGHTS },
};
