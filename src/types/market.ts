/** Static market configuration used by the odds input screen. */
export interface MarketLineConfig {
  line: number;
  label: string;
  marketType: "STANDARD" | "ASIAN";
}

export type Settlement = "WIN" | "HALF_WIN" | "PUSH" | "HALF_LOSS" | "LOSS";

export interface AsianMarket {
  line: number;
  side: "OVER" | "UNDER";
  odds: number;
  stake: number;
}

export interface SettlementResult {
  outcome: Settlement;
  /** Net profit as a fraction of stake, e.g. 0.85, 0.425, 0, -0.5, -1. */
  profitFactor: number;
  profit: number;
}

/* ------------------------------------------------------------------ */
/* Value analysis contracts (expected value, edge, staking).          */
/* Probabilities are decimals 0..1 everywhere, as in the rest of the  */
/* engine; percentages exist only in the presentation layer.          */
/* ------------------------------------------------------------------ */

export type ValueClassification = "POSITIVE_EV" | "NO_VALUE";

/**
 * How the model probability relates to the evaluated price. The label is
 * mandatory: a probability fitted from the same market is a consistency
 * check, never independent evidence of edge.
 */
export type ProbabilitySource = "SAME_MARKET_FIT" | "OUTSIDE_FIT";

/** Bankroll staking configuration; all three are user-set, never guessed. */
export interface StakingOptions {
  bankroll: number;
  /** Fraction of full Kelly applied (0.25 = quarter Kelly). */
  kellyMultiplier: number;
  /** Hard cap on stake as a fraction of bankroll, regardless of Kelly. */
  maxStakeFraction: number;
}

export const DEFAULT_STAKING_OPTIONS: StakingOptions = {
  bankroll: 1000,
  kellyMultiplier: 0.25,
  maxStakeFraction: 0.02,
};

export interface MarketAssessment {
  market: string;
  line: number;
  side: "OVER" | "UNDER";
  marketType: "STANDARD" | "ASIAN";
  bookmakerOdds: number;
  /** Raw implied probability 1/O (still contains the margin). */
  marketImpliedRaw: number;
  /** Margin-removed two-way probability, when both sides are quoted. */
  marketImpliedRemoved: number | null;
  /** Model win probability (push + half-win mass folded, settlement-aware). */
  modelProbability: number;
  probabilitySource: ProbabilitySource;
  /** Expected profit per unit staked, computed on the full distribution. */
  expectedValuePerUnit: number;
  /** EV / (odds - 1): full Kelly growth rate; push/half outcomes included. */
  fullKellyFraction: number;
  fractionalKellyFraction: number;
  /** After the maximum stake safety cap. */
  cappedStakeFraction: number;
  recommendedStake: number;
  classification: ValueClassification;
  warnings: string[];
}

export interface RangeComparison {
  label: string;
  min: number;
  max: number | null;
  /** Model estimate, always available. */
  modelProbability: number;
  /**
   * Market-derived estimate, only when bracketing complete (both-sides)
   * .5 anchors exist. Null means it cannot be honestly derived from the
   * provided prices - the reviewer-mandated rule.
   */
  marketProbability: number | null;
  fairOddsModel: number | null;
  fairOddsMarket: number | null;
  difference: number | null;
  notes: string[];
}

export interface DerivativeEstimate {
  label: string;
  probability: number;
  fairOdds: number | null;
  /** Closed form, e.g. "P(2) + P(3)". */
  formula: string;
}
