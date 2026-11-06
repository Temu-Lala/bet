"use client";

import { useCallback, useMemo, useState } from "react";
import { useStoreSelector } from "@/lib/utils/store";
import { analysisStore } from "@/stores/analysis-store";
import { analyzeMatch } from "@/lib/probability/advanced/exact-score";
import type { MatchAnalysisResult } from "@/types/analysis";

/**
 * Two-team analysis state: two scoring-rate inputs plus the matrix depth,
 * feeding the engine's analyzeMatch. All math happens inside the engine;
 * this hook only parses input text and forwards valid parameters.
 */
export function useMatchAnalysis() {
  const lastResult = useStoreSelector(analysisStore, (s) => s.result);

  const [homeText, setHomeText] = useState("0.95");
  const [awayText, setAwayText] = useState("1.15");
  const [maxGoals, setMaxGoals] = useState(8);

  const analysis = useMemo<{ result: MatchAnalysisResult | null; error: string | null }>(() => {
    const lambdaHome = Number.parseFloat(homeText);
    const lambdaAway = Number.parseFloat(awayText);
    if (!(lambdaHome > 0) || !(lambdaAway > 0) || lambdaHome > 12 || lambdaAway > 12) {
      return {
        result: null,
        error: "Enter both scoring rates as positive numbers between 0 and 12.",
      };
    }
    try {
      return { result: analyzeMatch({ lambdaHome, lambdaAway, maxGoals }), error: null };
    } catch (cause) {
      return { result: null, error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [homeText, awayText, maxGoals]);

  /**
   * Derive a two-rate starting point from the latest one-side fit: the fitted
   * expected total is split 55/45 home/away (typical home advantage). This is
   * an explicitly labeled approximation — the one-team fit does not identify
   * how the total splits between the sides.
   */
  const importFromLastAnalysis = useCallback(() => {
    if (!lastResult) return;
    const total = lastResult.expectedGoals;
    setHomeText((total * 0.55).toFixed(2));
    setAwayText((total * 0.45).toFixed(2));
  }, [lastResult]);

  return {
    homeText,
    setHomeText,
    awayText,
    setAwayText,
    maxGoals,
    setMaxGoals,
    result: analysis.result,
    error: analysis.error,
    importFromLastAnalysis,
    canImport: lastResult !== null,
  };
}
