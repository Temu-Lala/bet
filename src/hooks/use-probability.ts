"use client";

import { useStoreSelector } from "@/lib/utils/store";
import { analysisStore } from "@/stores/analysis-store";
import { settingsStore } from "@/stores/settings-store";
import { formatPercentage } from "@/lib/utils/format-percentage";

/**
 * Probability readout hook: the latest result with presentation-ready
 * formatting applied at the boundary (the engine keeps speaking decimals).
 */
export function useProbability() {
  const state = useStoreSelector(analysisStore, (s) => s);
  const precision = useStoreSelector(settingsStore, (s) => s.precision);

  const format = (value: number) => formatPercentage(value, precision);

  return {
    status: state.status,
    result: state.result,
    input: state.input,
    options: state.options,
    issues: state.issues,
    error: state.error,
    format,
  };
}
