import { poissonPmf } from "../core/poisson-pmf";
import { poissonCdf } from "../core/poisson-cdf";
import type { GoalDistribution } from "../../../types/model";

/**
 * Build a truncated Poisson goal distribution.
 *
 * Probabilities are computed for 0..maxGoals and the remaining mass
 * P(X > maxGoals) is retained as `tailProbability` — never discarded.
 * For a Poisson model the expected goals equal lambda exactly.
 */
export function poissonDistribution(
  lambda: number,
  maxGoals: number,
): GoalDistribution {
  if (!Number.isFinite(lambda) || lambda <= 0) {
    throw new RangeError(`Poisson lambda must be > 0, got ${lambda}`);
  }
  if (!Number.isInteger(maxGoals) || maxGoals < 5) {
    throw new RangeError(`maxGoals must be an integer >= 5, got ${maxGoals}`);
  }
  const probabilities: number[] = [];
  for (let k = 0; k <= maxGoals; k++) probabilities.push(poissonPmf(k, lambda));
  const tailProbability = Math.max(0, 1 - poissonCdf(maxGoals, lambda));
  return {
    model: "POISSON",
    probabilities,
    tailProbability,
    expectedGoals: lambda,
    lambda,
  };
}
