import type { ProbabilityResult } from "../../../types/probability";
import type { FittedModel } from "../models/fitted-poisson";
import type { BoundaryAnchor } from "../markets/market-boundaries";
import { toExactGoalProbabilities } from "../ranges/exact-goal-calculator";
import { aggregateRanges } from "../ranges/range-aggregation";
import { cumulativeFromVector } from "../ranges/cumulative-calculator";
import { validateDistribution } from "../core/probability-utils";

/**
 * Step 8: assemble and health-check the final result. A distribution that
 * leaves [0,1] or fails to sum to 1 (within tolerance) is a numerical
 * defect and is flagged in diagnostics instead of being silently returned.
 */
export function buildProbabilityResult(
  fitted: FittedModel,
  anchors: BoundaryAnchor[],
  extraWarnings: string[] = [],
): ProbabilityResult {
  const { distribution, fit } = fitted;

  const exactGoals = toExactGoalProbabilities(distribution.probabilities);
  const goalRanges = aggregateRanges(
    distribution.probabilities,
    distribution.tailProbability,
  );
  const cumulativeProbabilities = cumulativeFromVector(distribution.probabilities);

  const check = validateDistribution(
    distribution.probabilities,
    distribution.tailProbability,
    1e-6,
  );

  const numericalWarnings = check.ok
    ? []
    : [
        check.outOfRange
          ? "Numerical defect: a probability fell outside [0, 1]"
          : `Numerical defect: distribution sums to ${check.total.toFixed(8)} instead of 1`,
      ];

  return {
    exactGoals,
    goalRanges,
    cumulativeProbabilities,
    tailProbability: distribution.tailProbability,
    expectedGoals: distribution.expectedGoals,
    marketBoundaries: anchors,
    diagnostics: {
      model: distribution.model,
      lambda: fit.lambda,
      fittingError: fit.rmse,
      marketCount: anchors.length,
      warnings: [...extraWarnings, ...numericalWarnings],
    },
    totalProbability: check.total,
  };
}
