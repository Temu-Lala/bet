import type { ProbabilityResult } from "../../../types/probability";
import type { ModelComparisonRow } from "../../../types/model";

/**
 * Side-by-side model comparison. The engine may run more than one model
 * over identical anchors; this builds the presentation table and flags
 * divergences the user should see rather than hiding them.
 */
export function compareModels(
  results: { label: string; result: ProbabilityResult }[],
): ModelComparisonRow[] {
  return results.map(({ label, result }) => ({
    model: label,
    expectedGoals: result.expectedGoals,
    ranges: result.goalRanges,
    fittingError: result.diagnostics.fittingError,
  }));
}

/** Max absolute spread of range probabilities across models, per range. */
export function modelDivergence(
  results: { label: string; result: ProbabilityResult }[],
): { label: string; spread: number }[] {
  if (results.length < 2) return [];
  const labels = results[0].result.goalRanges.map((r) => r.label);
  return labels.map((label) => {
    const values = results.map(
      (entry) =>
        entry.result.goalRanges.find((r) => r.label === label)?.probability ?? 0,
    );
    return { label, spread: Math.max(...values) - Math.min(...values) };
  });
}
