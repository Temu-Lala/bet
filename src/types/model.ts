import type { GoalRangeProbability } from "./probability";

/** A distribution produced by a statistical model. */
export interface GoalDistribution {
  model: string;
  /** Probabilities for exactly 0..maxGoals goals. */
  probabilities: number[];
  /** Mass beyond maxGoals (1 - CDF(maxGoals)); never discarded. */
  tailProbability: number;
  expectedGoals: number;
  lambda: number;
}

export interface FitOutcome {
  lambda: number;
  /** Weighted sum of squared differences at the market anchors. */
  sse: number;
  /** Weighted RMSE, reported as fittingError in diagnostics. */
  rmse: number;
  converged: boolean;
}

export interface ModelComparisonRow {
  model: string;
  expectedGoals: number;
  ranges: GoalRangeProbability[];
  fittingError: number;
}
