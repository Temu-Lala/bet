import type { MarketAssessment, ProbabilitySource, StakingOptions } from "../../../types/market";
import {
  settlementProbabilities,
  settleAsianPosition,
  type AsianPosition,
} from "../odds/asian-settlement";
import { removeMarginTwoWay } from "../odds/margin-removal";

/**
 * Value detection with the safeguards the math demands:
 *
 *  - EV is computed on the FULL distribution through the settlement
 *    engine, so pushes and quarter-line half wins/losses are handled
 *    exactly (the binary p*O - 1 formula is only used for genuinely
 *    binary markets).
 *  - Full Kelly is the argmax of expected log-growth over the real
 *    outcome set {b, b/2, 0, -1/2, -1}, not the binary approximation.
 *  - Fractional Kelly and an absolute maximum stake cap are applied on
 *    top; low model/market agreement suppresses stakes entirely.
 *  - Negative-EV markets are classified NO_VALUE and RETAINED, never
 *    discarded, so the analysis history stays honest.
 *  - Every assessment carries a ProbabilitySource label: a probability
 *    fitted from the same market being evaluated is a consistency
 *    check, not independent evidence of edge.
 */

const GOLDEN_RATIO_CONJUGATE = (1 + Math.sqrt(5)) / 2;

/** Net profit per unit stake for each settlement outcome at given odds. */
function outcomeFactors(decimalOdds: number): number[] {
  const b = decimalOdds - 1;
  return [b, b / 2, 0, -0.5, -1]; // WIN, HALF_WIN, PUSH, HALF_LOSS, LOSS
}

const OUTCOME_KEYS = ["WIN", "HALF_WIN", "PUSH", "HALF_LOSS", "LOSS"] as const;

/** Golden-section maximization of expected log-growth over f in [0, 0.9]. */
export function kellyFromOutcomeDistribution(
  probabilities: Record<string, number>,
  decimalOdds: number,
): number {
  const factors = outcomeFactors(decimalOdds);
  const terms = OUTCOME_KEYS.map((key, i) => ({
    r: factors[i],
    p: probabilities[key] ?? 0,
  })).filter((t) => t.p > 0);

  const growth = (f: number): number => {
    let total = 0;
    for (const { r, p } of terms) {
      const wealth = 1 + f * r;
      if (wealth <= 0) return Number.NEGATIVE_INFINITY;
      total += p * Math.log(wealth);
    }
    return total;
  };

  // The growth curve is concave on the feasible interval; golden section
  // converges without derivatives.
  let lo = 0;
  let hi = 0.9;
  let f1 = hi - (hi - lo) / GOLDEN_RATIO_CONJUGATE;
  let f2 = lo + (hi - lo) / GOLDEN_RATIO_CONJUGATE;
  let g1 = growth(f1);
  let g2 = growth(f2);
  for (let i = 0; i < 80 && hi - lo > 1e-8; i++) {
    if (g1 >= g2) {
      hi = f2;
      f2 = f1;
      g2 = g1;
      f1 = hi - (hi - lo) / GOLDEN_RATIO_CONJUGATE;
      g1 = growth(f1);
    } else {
      lo = f1;
      f1 = f2;
      g1 = g2;
      f2 = lo + (hi - lo) / GOLDEN_RATIO_CONJUGATE;
      g2 = growth(f2);
    }
  }
  return Math.max(0, (lo + hi) / 2);
}

function validateStaking(staking: StakingOptions): void {
  if (!Number.isFinite(staking.bankroll) || staking.bankroll <= 0) {
    throw new RangeError(`Bankroll must be a positive finite number, got ${staking.bankroll}`);
  }
  if (!(staking.kellyMultiplier > 0 && staking.kellyMultiplier <= 1)) {
    throw new RangeError(`Kelly multiplier must be in (0, 1], got ${staking.kellyMultiplier}`);
  }
  if (!(staking.maxStakeFraction > 0 && staking.maxStakeFraction <= 1)) {
    throw new RangeError(`Max stake fraction must be in (0, 1], got ${staking.maxStakeFraction}`);
  }
}

interface AssessmentInput {
  market: string;
  line: number;
  side: "OVER" | "UNDER";
  marketType: "STANDARD" | "ASIAN";
  bookmakerOdds: number;
  probabilities: Record<string, number>;
  /** Expected profit per unit staked, computed by the caller. */
  evPerUnit: number;
  marketImpliedRemoved: number | null;
  probabilitySource: ProbabilitySource;
  staking: StakingOptions;
  lowAgreement: boolean;
}

function buildAssessment(input: AssessmentInput): MarketAssessment {
  const { bookmakerOdds, staking } = input;
  if (!Number.isFinite(bookmakerOdds) || bookmakerOdds <= 1) {
    throw new RangeError(`Bookmaker odds must be > 1, got ${bookmakerOdds}`);
  }
  validateStaking(staking);

  const positiveEv = input.evPerUnit > 0;
  const fullKelly = positiveEv ? kellyFromOutcomeDistribution(input.probabilities, bookmakerOdds) : 0;
  const fractional = fullKelly * staking.kellyMultiplier;
  const capped = Math.min(fractional, staking.maxStakeFraction);

  const warnings: string[] = [];
  if (input.probabilitySource === "SAME_MARKET_FIT") {
    warnings.push(
      "Fitted from this same market - this EV measures consistency with the price, not independent evidence of edge.",
    );
  }
  if (!positiveEv) {
    warnings.push("Non-positive expected value - retained as NO_VALUE, stake 0.");
  }
  if (positiveEv && input.lowAgreement) {
    warnings.push(
      "Model/market agreement is low (fit RMSE above threshold) - Kelly stake suppressed; treat the estimate as unreliable.",
    );
  }
  if (positiveEv && !input.lowAgreement && capped < fractional - 1e-12) {
    warnings.push(
      `Fractional Kelly (${(fractional * 100).toFixed(2)}%) exceeds the maximum stake cap; capped to ${(staking.maxStakeFraction * 100).toFixed(1)}%.`,
    );
  }
  const stake = positiveEv && !input.lowAgreement ? staking.bankroll * capped : 0;

  return {
    market: input.market,
    line: input.line,
    side: input.side,
    marketType: input.marketType,
    bookmakerOdds,
    marketImpliedRaw: 1 / bookmakerOdds,
    marketImpliedRemoved: input.marketImpliedRemoved,
    modelProbability: (input.probabilities.WIN ?? 0) + 0.5 * (input.probabilities.HALF_WIN ?? 0),
    probabilitySource: input.probabilitySource,
    expectedValuePerUnit: input.evPerUnit,
    fullKellyFraction: fullKelly,
    fractionalKellyFraction: fractional,
    cappedStakeFraction: capped,
    recommendedStake: stake,
    classification: positiveEv ? "POSITIVE_EV" : "NO_VALUE",
    warnings,
  };
}

/**
 * Evaluate an offered position against the model's full goal distribution.
 * `distribution[g]` is P(X = g) for g in 0..maxGoals; `tailProbability`
 * is the retained mass above maxGoals (far-field outcomes settle fully
 * won for OVER, fully lost for UNDER).
 */
export function evaluateSettlementMarket(input: {
  market: string;
  line: number;
  side: "OVER" | "UNDER";
  marketType: "STANDARD" | "ASIAN";
  bookmakerOdds: number;
  distribution: number[];
  tailProbability: number;
  /** Counterpart odds for two-way margin removal, when quoted. */
  counterpartOdds: number | null;
  marginMethod: "MULTIPLICATIVE" | "ADDITIVE" | "POWER";
  probabilitySource: ProbabilitySource;
  staking: StakingOptions;
  lowAgreement: boolean;
}): MarketAssessment {
  const p = input.bookmakerOdds;
  if (!Number.isFinite(p) || p <= 1) {
    throw new RangeError(`Bookmaker odds must be > 1, got ${p}`);
  }
  if (!Number.isFinite(input.line) || input.line < 0) {
    throw new RangeError(`Market line must be a non-negative number, got ${input.line}`);
  }

  const position: AsianPosition = {
    line: input.line,
    side: input.side,
    odds: p,
    stake: 1,
  };
  const probabilities = settlementProbabilities(position, input.distribution, input.tailProbability);

  // EV per unit stake through the exact settlement factors.
  const b = p - 1;
  let ev = 0;
  for (let goals = 0; goals < input.distribution.length; goals++) {
    const pg = input.distribution[goals] ?? 0;
    if (pg !== 0) ev += pg * settleAsianPosition(goals, position).profitFactor;
  }
  ev += input.tailProbability * (input.side === "OVER" ? b : -1);

  // Two-way margin-removed market probability, when a counterpart is quoted.
  let removed: number | null = null;
  if (input.counterpartOdds !== null && Number.isFinite(input.counterpartOdds) && input.counterpartOdds > 1) {
    const pair = removeMarginTwoWay(
      input.side === "UNDER" ? p : input.counterpartOdds,
      input.side === "OVER" ? p : input.counterpartOdds,
      input.marginMethod,
    );
    removed = input.side === "OVER" ? pair.over : pair.under;
  }

  return buildAssessment({
    market: input.market,
    line: input.line,
    side: input.side,
    marketType: input.marketType,
    bookmakerOdds: p,
    probabilities,
    evPerUnit: ev,
    marketImpliedRemoved: removed,
    probabilitySource: input.probabilitySource,
    staking: input.staking,
    lowAgreement: input.lowAgreement,
  });
}

/**
 * Evaluate a genuinely binary market (no push, no halves) with the
 * reviewer's formulas: EV = p*O - 1, f* = (b*p - q)/b (recovered as the
 * special case of the log-growth maximization on {b, -1}).
 */
export function evaluateBinaryMarket(input: {
  market: string;
  bookmakerOdds: number;
  modelProbability: number;
  marketImpliedRemoved: number | null;
  probabilitySource: ProbabilitySource;
  staking: StakingOptions;
  lowAgreement: boolean;
}): MarketAssessment {
  const p = input.modelProbability;
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new RangeError(`Model probability must be in (0, 1), got ${p}`);
  }
  if (!Number.isFinite(input.bookmakerOdds) || input.bookmakerOdds <= 1) {
    throw new RangeError(`Bookmaker odds must be > 1, got ${input.bookmakerOdds}`);
  }
  return buildAssessment({
    market: input.market,
    line: Number.NaN,
    side: "OVER",
    marketType: "STANDARD",
    bookmakerOdds: input.bookmakerOdds,
    probabilities: { WIN: p, HALF_WIN: 0, PUSH: 0, HALF_LOSS: 0, LOSS: 1 - p },
    evPerUnit: p * input.bookmakerOdds - 1,
    marketImpliedRemoved: input.marketImpliedRemoved,
    probabilitySource: input.probabilitySource,
    staking: input.staking,
    lowAgreement: input.lowAgreement,
  });
}
