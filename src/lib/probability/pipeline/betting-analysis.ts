import type { OddsInput, ProbabilityResult } from "../../../types/probability";
import type { CalculationOptions } from "../../../types/odds";
import type {
  DerivativeEstimate,
  MarketAssessment,
  RangeComparison,
  StakingOptions,
} from "../../../types/market";
import { evaluateSettlementMarket } from "../value/value-detector";
import { compareModelToMarket, derivativeEstimates } from "../value/market-comparison";

/**
 * Betting analysis pipeline: takes the fitted probability result and the
 * original offered markets, and produces
 *
 *  1. per-side value assessments (EV + guarded Kelly stakes),
 *  2. the model-vs-market range comparison (market side only where the
 *     prices honestly allow it),
 *  3. model-only derivative estimates with their closed forms.
 *
 * The layer never invents odds, never re-derives probabilities through a
 * different code path, and labels every probability with its source.
 */

/** Above this weighted RMSE the fit disagrees materially with the prices. */
export const LOW_AGREEMENT_FIT_ERROR = 0.06;

export interface BettingAnalysisOutput {
  assessments: MarketAssessment[];
  rangeComparisons: RangeComparison[];
  derivatives: DerivativeEstimate[];
  warnings: string[];
}

export function runBettingAnalysis(
  result: ProbabilityResult,
  input: OddsInput,
  options: CalculationOptions,
  staking: StakingOptions,
): BettingAnalysisOutput {
  const distribution = result.exactGoals.map((e) => e.probability);
  const tail = result.tailProbability;
  const lowAgreement = result.diagnostics.fittingError > LOW_AGREEMENT_FIT_ERROR;

  const warnings: string[] = [];
  if (lowAgreement) {
    warnings.push(
      `Weighted fit RMSE ${result.diagnostics.fittingError.toFixed(4)} exceeds ${LOW_AGREEMENT_FIT_ERROR}: model and prices materially disagree, so all Kelly stakes are suppressed on this analysis.`,
    );
  }
  warnings.push(
    "Positive EV here is not evidence of a tradable edge: probabilities were fitted from these same prices unless labelled OUTSIDE_FIT, and calibration against outcomes (backtesting) is required before stakes can be trusted.",
  );

  const assessments: MarketAssessment[] = [];
  for (const market of input.markets) {
    const counterpart = (side: "OVER" | "UNDER") =>
      side === "OVER" ? market.under : market.over;
    for (const side of ["OVER", "UNDER"] as const) {
      const odds = side === "OVER" ? market.over : market.under;
      if (odds === null || !Number.isFinite(odds) || odds <= 1) continue;

      // Source classification from the actual fit inputs: an anchor at
      // this line with positive weight contributed to lambda; a zero
      // weight (excluded) or absent anchor did not.
      const anchor = result.marketBoundaries.find(
        (a) => Math.abs(a.line - market.line) < 1e-9,
      );
      const contributed = anchor !== undefined && anchor.weight > 0;

      const label = `${side} ${market.line}`;
      try {
        assessments.push(
          evaluateSettlementMarket({
            market: label,
            line: market.line,
            side,
            marketType: market.marketType,
            bookmakerOdds: odds,
            distribution,
            tailProbability: tail,
            counterpartOdds: (() => {
              const c = counterpart(side);
              return c !== null && Number.isFinite(c) && c > 1 ? c : null;
            })(),
            marginMethod: options.marginMethod,
            probabilitySource: contributed ? "SAME_MARKET_FIT" : "OUTSIDE_FIT",
            staking,
            lowAgreement,
          }),
        );
      } catch {
        // An unpriceable side is skipped, but never silently: the row
        // was already rejected by odds validation upstream, so this is a
        // defensive path only.
        warnings.push(`Skipped ${label}: odds failed engine validation.`);
      }
    }
  }

  return {
    assessments,
    rangeComparisons: compareModelToMarket(result),
    derivatives: derivativeEstimates(result),
    warnings,
  };
}
