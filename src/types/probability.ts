/**
 * Core contract between the probability engine and the frontend.
 * The engine always works in decimal probabilities (0..1).
 * Percentage conversion happens only in the presentation layer.
 */

export interface MarketOdds {
  /** Goal line, e.g. 0.5, 1.5, 4.5 (standard) or 5.0, 5.5, 2.25 (asian). */
  line: number;
  /** Decimal odds for "under". Null when the user did not provide it. */
  under: number | null;
  /** Decimal odds for "over". Null when the user did not provide it. */
  over: number | null;
  marketType: "STANDARD" | "ASIAN";
}

export interface OddsInput {
  teamName?: string;
  bookmaker?: string;
  markets: MarketOdds[];
}

export interface GoalProbability {
  goals: number;
  probability: number;
}

export interface GoalRangeProbability {
  label: string;
  min: number;
  max: number | null;
  probability: number;
}

/** A cumulative anchor extracted from a bookmaker market: P(X <= k). */
export interface MarketBoundary {
  line: number;
  /** Integer goal threshold k such that the anchor is P(X <= k). */
  k: number;
  /** Margin-removed probability, 0..1. */
  probability: number;
  /** Reliability weight used during model fitting. */
  weight: number;
  /** Whether both market sides were provided. */
  complete: boolean;
  notes: string[];
}

export interface ModelDiagnostics {
  model: string;
  lambda: number;
  /** Weighted root mean squared error between model CDF and market anchors. */
  fittingError: number;
  marketCount: number;
  warnings: string[];
}

export interface ProbabilityResult {
  /** Exact goal probabilities 0..maxGoals. */
  exactGoals: GoalProbability[];
  /** Aggregated ranges (0-1, 2-3, 4-5, 6+), tail included. Sums to 1. */
  goalRanges: GoalRangeProbability[];
  /** Cumulative model probabilities keyed as "P(X<=0)", "P(X<=1)", ... */
  cumulativeProbabilities: Record<string, number>;
  /** Probability mass beyond maxGoals, never discarded. */
  tailProbability: number;
  /** Expected goals (mean of the fitted distribution). */
  expectedGoals: number;
  /** Bookmaker-implied anchors, kept separate from model output. */
  marketBoundaries: MarketBoundary[];
  diagnostics: ModelDiagnostics;
  /** Should be 1 within numerical tolerance. */
  totalProbability: number;
}
