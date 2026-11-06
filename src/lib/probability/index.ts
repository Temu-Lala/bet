/**
 * Public API of the standalone probability engine.
 * The frontend should normally only import `calculateProbabilities`,
 * `analyzeMatch` and the settlement helpers from this barrel.
 */

export { calculateProbabilities, CalculationError } from "./pipeline/calculation-engine";
export type { CalculationOptions } from "../../types/odds";

export { analyzeMatch } from "./advanced/exact-score";
export type { MatchInput } from "./advanced/exact-score";
export { bttsProbabilities } from "./advanced/btts";
export { totalGoalsDistribution, totalLineProbability } from "./advanced/total-goals";
export { expectedValuePerUnit, fairOddsFromProbability } from "./advanced/expected-value";
export { kellyFraction, fractionalKelly } from "./advanced/kelly-criterion";
export { compareModels, modelDivergence } from "./advanced/probability-comparison";

export {
  evaluateSettlementMarket,
  evaluateBinaryMarket,
  kellyFromOutcomeDistribution,
} from "./value/value-detector";
export {
  compareModelToMarket,
  derivativeEstimates,
  marketRangeProbability,
} from "./value/market-comparison";
export { runBettingAnalysis, LOW_AGREEMENT_FIT_ERROR } from "./pipeline/betting-analysis";

export {
  settleAsianPosition,
  settlementProbabilities,
  splitQuarterLine,
  isQuarterLine,
  isWholeLine,
} from "./odds/asian-settlement";
export type { AsianPosition, SettlementOutcome } from "./odds/asian-settlement";

export { impliedProbability, oddsFromProbability } from "./odds/implied-probability";
export { removeMarginTwoWay } from "./odds/margin-removal";
export type { MarginMethod } from "./odds/margin-removal";
export { overround, fairOdds } from "./odds/overround";
export {
  decimalToAmerican,
  americanToDecimal,
  decimalToFractional,
} from "./odds/odds-conversion";

export { poissonPmf } from "./core/poisson-pmf";
export { poissonCdf } from "./core/poisson-cdf";
export { factorial } from "./core/factorial";
export { combinations } from "./core/combinations";

export {
  DEFAULT_GOAL_RANGES,
  calculateGoalRange,
} from "./ranges/goal-range-calculator";
export type { GoalRange } from "./ranges/goal-range-calculator";

export { validateMarkets, parseOddsValue } from "./markets/market-validation";
export { checkMarketConsistency } from "./markets/market-consistency";
export { extractMarketBoundaries, DEFAULT_MARKET_WEIGHTS } from "./markets/market-boundaries";
export type { BoundaryAnchor } from "./markets/market-boundaries";
export {
  defaultMarketScaffold,
  sampleMarketOdds,
  STANDARD_GOAL_LINES,
  ASIAN_GOAL_LINES,
} from "./markets/goal-markets";

export { fitLambdaLeastSquares } from "./fitting/lambda-estimator";
export { fitLambdaMaximumLikelihood } from "./fitting/maximum-likelihood";

export type {
  OddsInput,
  MarketOdds,
  ProbabilityResult,
  GoalProbability,
  GoalRangeProbability,
  MarketBoundary,
  ModelDiagnostics,
} from "../../types/probability";
export type { ValidationResult, ValidationIssue, StoredCalculation, MarketWeights } from "../../types/odds";
export type { MatchAnalysisResult, ExactScoreProbability } from "../../types/analysis";
export type {
  Settlement,
  StakingOptions,
  MarketAssessment,
  RangeComparison,
  DerivativeEstimate,
  ProbabilitySource,
  ValueClassification,
} from "../../types/market";
export { DEFAULT_STAKING_OPTIONS } from "../../types/market";
