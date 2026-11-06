import type { ProbabilityResult } from "../../types/probability";

/**
 * Result schema: the guard applied whenever a result crosses a persistence
 * boundary (localStorage history, restored drafts). Anything that fails
 * this check must never be rendered as trustworthy output.
 */
export function isProbabilityResult(value: unknown): value is ProbabilityResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.exactGoals) &&
    Array.isArray(candidate.goalRanges) &&
    typeof candidate.tailProbability === "number" &&
    typeof candidate.expectedGoals === "number" &&
    typeof candidate.totalProbability === "number" &&
    Math.abs((candidate.totalProbability as number) - 1) < 1e-4 &&
    typeof candidate.diagnostics === "object" &&
    candidate.diagnostics !== null
  );
}
