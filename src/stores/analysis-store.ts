"use client";

import { createStore } from "@/lib/utils/store";
import type { ProbabilityResult, OddsInput } from "@/types/probability";
import type { CalculationOptions, ValidationIssue } from "@/types/odds";

/**
 * Analysis store: latest calculation result plus status. It holds results,
 * it does not compute them — the engine is the only place math happens.
 */

export type AnalysisStatus = "idle" | "validating" | "calculating" | "done" | "error";

export interface AnalysisState {
  status: AnalysisStatus;
  result: ProbabilityResult | null;
  input: OddsInput | null;
  options: CalculationOptions | null;
  issues: ValidationIssue[];
  error: string | null;
}

export const analysisStore = createStore<AnalysisState>({
  status: "idle",
  result: null,
  input: null,
  options: null,
  issues: [],
  error: null,
});

export function setAnalysisRunning(): void {
  analysisStore.set({ status: "calculating", error: null });
}

export function setAnalysisSuccess(
  result: ProbabilityResult,
  input: OddsInput,
  options: CalculationOptions,
  issues: ValidationIssue[],
): void {
  analysisStore.set({
    status: "done",
    result,
    input,
    options,
    issues,
    error: null,
  });
}

export function setAnalysisFailure(error: string, issues: ValidationIssue[] = []): void {
  analysisStore.set({ status: "error", error, issues, result: null });
}
