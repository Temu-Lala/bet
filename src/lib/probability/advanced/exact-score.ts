import { independentScoreMatrix, outcomesFromMatrix, bttsFromMatrix } from "../models/independent-poisson";
import type { ExactScoreProbability, MatchAnalysisResult } from "../../../types/analysis";
import type { GoalProbability } from "../../../types/probability";
import { poissonPmf } from "../core/poisson-pmf";
import { poissonCdf } from "../core/poisson-cdf";

/**
 * Exact-score and full-match analysis under the independent Poisson model.
 * Requires two scoring rates (home and away), each of which can come from
 * its own set of bookmaker markets via the calculation engine.
 */

export interface MatchInput {
  lambdaHome: number;
  lambdaAway: number;
  maxGoals?: number;
}

export function analyzeMatch({
  lambdaHome,
  lambdaAway,
  maxGoals = 8,
}: MatchInput): MatchAnalysisResult {
  if (!(lambdaHome > 0) || !(lambdaAway > 0)) {
    throw new RangeError("Both scoring rates must be > 0 for a match analysis");
  }

  const { matrix, homeMarginal, awayMarginal } = independentScoreMatrix(lambdaHome, lambdaAway, maxGoals);
  const outcomes = outcomesFromMatrix(matrix);
  const btts = bttsFromMatrix(matrix);

  // Total match goals: Poisson(lambdaHome + lambdaAway) — exact for
  // independent Poisson variables.
  const lambdaTotal = lambdaHome + lambdaAway;
  const totalGoals: GoalProbability[] = [];
  for (let k = 0; k <= maxGoals; k++) {
    totalGoals.push({ goals: k, probability: poissonPmf(k, lambdaTotal) });
  }
  const tailProbability = Math.max(0, 1 - poissonCdf(maxGoals, lambdaTotal));

  const toGoalProbabilities = (values: number[]): GoalProbability[] =>
    values.map((probability, goals) => ({ goals, probability }));

  const totalCumulative: Record<string, number> = {};
  let running = 0;
  for (const entry of totalGoals) {
    running += entry.probability;
    totalCumulative[`P(total<=${entry.goals})`] = running;
  }

  const scores: ExactScoreProbability[] = [];
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      scores.push({ home: i, away: j, probability: matrix[i][j] });
    }
  }
  scores.sort((a, b) => b.probability - a.probability);

  return {
    homeLambda: lambdaHome,
    awayLambda: lambdaAway,
    ...outcomes,
    bttsYes: btts.yes,
    bttsNo: btts.no,
    totalGoals,
    homeMarginal: toGoalProbabilities(homeMarginal),
    awayMarginal: toGoalProbabilities(awayMarginal),
    tailProbability,
    totalCumulative,
    topScores: scores.slice(0, 12),
    scoreMatrix: matrix,
  };
}
