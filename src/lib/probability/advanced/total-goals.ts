import { poissonPmf } from "../core/poisson-pmf";
import { poissonCdf } from "../core/poisson-cdf";
import type { GoalProbability } from "../../../types/probability";

/**
 * Total match goals distribution. The sum of two independent Poisson
 * variables is Poisson(lambdaHome + lambdaAway), so match totals come
 * for free once both scoring rates are estimated.
 */
export function totalGoalsDistribution(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals: number,
): { distribution: GoalProbability[]; tailProbability: number } {
  const lambda = lambdaHome + lambdaAway;
  const distribution: GoalProbability[] = [];
  for (let k = 0; k <= maxGoals; k++) {
    distribution.push({ goals: k, probability: poissonPmf(k, lambda) });
  }
  return {
    distribution,
    tailProbability: Math.max(0, 1 - poissonCdf(maxGoals, lambda)),
  };
}

/** Over/Under probability for any .5 total line from the combined rate. */
export function totalLineProbability(
  lambdaHome: number,
  lambdaAway: number,
  line: number,
): { under: number; over: number } {
  const k = Math.floor(line);
  const under = poissonCdf(k, lambdaHome + lambdaAway);
  return { under, over: 1 - under };
}
