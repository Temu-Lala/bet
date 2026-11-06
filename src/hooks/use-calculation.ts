"use client";

import { useCallback } from "react";
import { useStoreSelector } from "@/lib/utils/store";
import { analysisStore, setAnalysisRunning, setAnalysisSuccess, setAnalysisFailure } from "@/stores/analysis-store";
import { settingsStore } from "@/stores/settings-store";
import { calculateProbabilities, CalculationError } from "@/lib/probability";
import { validateRows, rowsToMarkets, type OddsFormRow } from "@/lib/validation/odds.schema";
import { saveToHistory } from "@/lib/storage/calculation-storage";
import type { StoredCalculation } from "@/types/odds";

/**
 * Calculation hook: the bridge between the odds form and the engine.
 * The engine call is synchronous and dependency-free; this hook only
 * orchestrates status transitions and history persistence.
 */
export function useCalculation() {
  const state = useStoreSelector(analysisStore, (s) => s);
  const settings = useStoreSelector(settingsStore, (s) => s);

  const calculate = useCallback(
    (rows: OddsFormRow[], teamName: string, bookmaker: string) => {
      setAnalysisRunning();

      const validation = validateRows(rows);
      if (!validation.valid) {
        setAnalysisFailure(
          "Fix the highlighted input errors before calculating",
          validation.issues,
        );
        return;
      }

      try {
        const input = {
          teamName: teamName || undefined,
          bookmaker: bookmaker || undefined,
          markets: rowsToMarkets(rows),
        };
        const options = {
          model: settings.model,
          marginMethod: settings.marginMethod,
          maxGoals: settings.maxGoals,
          marketWeights: settings.marketWeights,
        };

        const result = calculateProbabilities(input, options);
        setAnalysisSuccess(result, input, options, validation.issues);

        const entry: StoredCalculation = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          input,
          options,
          result,
        };
        saveToHistory(entry);
      } catch (error) {
        if (error instanceof CalculationError) {
          setAnalysisFailure(error.message, error.issues.map((i) => ({
            code: "INVALID_DATA",
            field: "markets",
            message: i,
            severity: "error",
          })));
        } else {
          setAnalysisFailure(
            error instanceof Error ? error.message : "Unexpected calculation failure",
          );
        }
      }
    },
    [settings],
  );

  return { ...state, calculate };
}
