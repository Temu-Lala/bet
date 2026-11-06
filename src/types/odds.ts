import type { OddsInput, ProbabilityResult } from "./probability";

export type MarginMethod = "MULTIPLICATIVE" | "ADDITIVE" | "POWER";
export type ModelKind = "POISSON" | "NEGATIVE_BINOMIAL";

/**
 * Relative reliability weights applied to each market category during
 * model fitting (reviewer-approved improvement: markets differ in quality,
 * liquidity and margin contamination). Zero excludes a category from the
 * fit entirely; defaults live in the engine (DEFAULT_MARKET_WEIGHTS).
 */
export interface MarketWeights {
  /** Both sides provided, standard line: margin fully removable. */
  completeStandard: number;
  /** Both sides provided, whole-number Asian line (push accounted). */
  completeAsianWhole: number;
  /** Only one side provided: raw probability still contains the margin. */
  oneSided: number;
}

export interface CalculationOptions {
  model: ModelKind;
  marginMethod: MarginMethod;
  maxGoals: number;
  /** Optional; engine falls back to DEFAULT_MARKET_WEIGHTS per category. */
  marketWeights?: Partial<MarketWeights>;
}

/** Validation issue codes, kept intentionally distinct. */
export type ValidationCode =
  | "MISSING_DATA"
  | "INVALID_DATA"
  | "INCOMPLETE_MARKET"
  | "INCONSISTENT_MARKET"
  | "DUPLICATE_LINE"
  | "NO_USABLE_MARKETS";

export interface ValidationIssue {
  code: ValidationCode;
  field: string;
  message: string;
  /** Issues with severity "error" block calculation, "warning" do not. */
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/** A persisted analysis snapshot for the history screen. */
export interface StoredCalculation {
  id: string;
  createdAt: string;
  input: OddsInput;
  options: CalculationOptions;
  result: ProbabilityResult;
}
