"use client";

import { useMemo } from "react";
import { useProbability } from "@/hooks/use-probability";
import { useStoreSelector } from "@/lib/utils/store";
import { settingsStore } from "@/stores/settings-store";
import { runBettingAnalysis } from "@/lib/probability";
import type { BettingAnalysisOutput } from "@/lib/probability/pipeline/betting-analysis";

/**
 * Betting analysis hook: composes the last successful calculation with
 * the persisted staking settings. All math happens in the engine; this
 * hook only memoizes the composition and never recalculates probabilities
 * through a second code path.
 */
export function useBettingAnalysis() {
  const { result, input, options, status } = useProbability();
  const staking = useStoreSelector(settingsStore, (s) => s.staking);
  const precision = useStoreSelector(settingsStore, (s) => s.precision);

  const analysis: BettingAnalysisOutput | null = useMemo(() => {
    if (!result || !input || !options) return null;
    try {
      return runBettingAnalysis(result, input, options, staking);
    } catch {
      // Staking inputs failed engine validation; surfaced via the
      // settings screen values rather than pretending a result exists.
      return null;
    }
  }, [result, input, options, staking]);

  return { analysis, status, staking, precision };
}
