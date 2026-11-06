import type { GoalProbability } from "./probability";

/** Full two-team match analysis produced by the engine. */
export interface ExactScoreProbability {
  home: number;
  away: number;
  probability: number;
}

export interface MatchAnalysisResult {
  homeLambda: number;
  awayLambda: number;
  /** Home win / draw / away win probabilities (mutually exclusive, sums to 1). */
  homeWin: number;
  draw: number;
  awayWin: number;
  /** Both teams to score. */
  bttsYes: number;
  bttsNo: number;
  /** Total match goals distribution (Poisson(lambdaHome + lambdaAway)). */
  totalGoals: GoalProbability[];
  /** Single-team goal marginals P(home = k) and P(away = k). */
  homeMarginal: GoalProbability[];
  awayMarginal: GoalProbability[];
  tailProbability: number;
  /** Cumulative P(total <= k) for over/under presentation. */
  totalCumulative: Record<string, number>;
  /** Most probable exact scores, descending, top N. */
  topScores: ExactScoreProbability[];
  /** Matrix[i][j] = P(home = i, away = j), 0..maxGoals each side. */
  scoreMatrix: number[][];
}
