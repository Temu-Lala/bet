import { test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateBinaryMarket,
  evaluateSettlementMarket,
  kellyFromOutcomeDistribution,
} from "../../../src/lib/probability/value/value-detector";
import {
  marketRangeProbability,
  compareModelToMarket,
  derivativeEstimates,
} from "../../../src/lib/probability/value/market-comparison";
import { runBettingAnalysis, LOW_AGREEMENT_FIT_ERROR } from "../../../src/lib/probability/pipeline/betting-analysis";
import { calculateProbabilities } from "../../../src/lib/probability/pipeline/calculation-engine";
import { extractMarketBoundaries } from "../../../src/lib/probability/markets/market-boundaries";
import { poissonPmf } from "../../../src/lib/probability/core/poisson-pmf";
import { poissonCdf } from "../../../src/lib/probability/core/poisson-cdf";
import type { StakingOptions } from "../../../src/types/market";
import type { CalculationOptions } from "../../../src/types/odds";

const staking: StakingOptions = { bankroll: 1000, kellyMultiplier: 0.25, maxStakeFraction: 0.02 };

function poissonVector(lambda: number, max = 15): { distribution: number[]; tail: number } {
  const distribution: number[] = [];
  for (let g = 0; g <= max; g++) distribution.push(poissonPmf(g, lambda));
  return { distribution, tail: Math.max(0, 1 - poissonCdf(max, lambda)) };
}

/* ------------------------------------------------------------------ */
/* Reviewer's corrected Poisson table at lambda = 2.7062               */
/* ------------------------------------------------------------------ */

test("engine Poisson reproduces the reviewer's corrected derivative numbers", () => {
  const lambda = 2.7062;
  assert.ok(Math.abs(poissonPmf(2, lambda) + poissonPmf(3, lambda) - 0.4652) < 5e-4);
  assert.ok(Math.abs((1 - poissonCdf(2, lambda)) - 0.5078) < 5e-4);
  assert.ok(Math.abs(poissonPmf(0, lambda) - 0.0668) < 5e-4);
  assert.ok(Math.abs(poissonPmf(2, lambda) - 0.2446) < 5e-4);
});

/* ------------------------------------------------------------------ */
/* Binary EV: reference values from the review                         */
/* ------------------------------------------------------------------ */

test("binary EV matches the reference computations", () => {
  const good = evaluateBinaryMarket({
    market: "Over 1.5",
    bookmakerOdds: 1.4,
    modelProbability: 0.7455,
    marketImpliedRemoved: null,
    probabilitySource: "OUTSIDE_FIT",
    staking,
    lowAgreement: false,
  });
  assert.ok(Math.abs(good.expectedValuePerUnit - 0.0437) < 1e-6);
  assert.equal(good.classification, "POSITIVE_EV");

  const bad = evaluateBinaryMarket({
    market: "Under 1.5",
    bookmakerOdds: 3.1,
    modelProbability: 0.2545,
    marketImpliedRemoved: null,
    probabilitySource: "OUTSIDE_FIT",
    staking,
    lowAgreement: false,
  });
  assert.ok(Math.abs(bad.expectedValuePerUnit - -0.21105) < 1e-6);
  // NO_VALUE markets are retained with a classification, never discarded.
  assert.equal(bad.classification, "NO_VALUE");
  assert.equal(bad.recommendedStake, 0);
  assert.ok(bad.warnings.some((w) => /NO_VALUE/.test(w)));
});

test("binary Kelly matches (b*p - q)/b and the cap binds", () => {
  const a = evaluateBinaryMarket({
    market: "Over 1.5",
    bookmakerOdds: 1.4,
    modelProbability: 0.7455,
    marketImpliedRemoved: null,
    probabilitySource: "OUTSIDE_FIT",
    staking,
    lowAgreement: false,
  });
  const b = 0.4;
  const fullKelly = (b * 0.7455 - 0.2545) / b; // 0.10925
  assert.ok(Math.abs(a.fullKellyFraction - fullKelly) < 1e-6);
  const quarter = fullKelly * 0.25; // 0.0273125 > 0.02 cap
  assert.ok(quarter > staking.maxStakeFraction);
  assert.equal(a.cappedStakeFraction, staking.maxStakeFraction);
  assert.ok(Math.abs(a.recommendedStake - 20) < 1e-9);
  assert.ok(a.warnings.some((w) => /exceeds the maximum stake cap/.test(w)));
});

test("low agreement suppresses stakes but keeps the assessment", () => {
  const a = evaluateBinaryMarket({
    market: "Over 1.5",
    bookmakerOdds: 1.4,
    modelProbability: 0.7455,
    marketImpliedRemoved: null,
    probabilitySource: "SAME_MARKET_FIT",
    staking,
    lowAgreement: true,
  });
  assert.equal(a.classification, "POSITIVE_EV");
  assert.equal(a.recommendedStake, 0);
  assert.ok(a.fullKellyFraction > 0);
  assert.ok(a.warnings.some((w) => /stake suppressed/.test(w)));
  assert.ok(a.warnings.some((w) => /same market/.test(w)));
});

test("invalid inputs throw instead of guessing", () => {
  assert.throws(
    () =>
      evaluateBinaryMarket({
        market: "x",
        bookmakerOdds: 1.0,
        modelProbability: 0.5,
        marketImpliedRemoved: null,
        probabilitySource: "OUTSIDE_FIT",
        staking,
        lowAgreement: false,
      }),
    RangeError,
  );
  assert.throws(
    () =>
      evaluateBinaryMarket({
        market: "x",
        bookmakerOdds: 2.0,
        modelProbability: 1.2,
        marketImpliedRemoved: null,
        probabilitySource: "OUTSIDE_FIT",
        staking,
        lowAgreement: false,
      }),
    RangeError,
  );
  assert.throws(
    () =>
      evaluateBinaryMarket({
        market: "x",
        bookmakerOdds: 2.0,
        modelProbability: 0.5,
        marketImpliedRemoved: null,
        probabilitySource: "OUTSIDE_FIT",
        staking: { ...staking, bankroll: -5 },
        lowAgreement: false,
      }),
    RangeError,
  );
});

/* ------------------------------------------------------------------ */
/* Settlement-aware EV                                                 */
/* ------------------------------------------------------------------ */

test("whole Asian line EV accounts for the push exactly", () => {
  const { distribution, tail } = poissonVector(2.7);
  const odds = 1.9;
  const a = evaluateSettlementMarket({
    market: "Over 2.0",
    line: 2.0,
    side: "OVER",
    marketType: "ASIAN",
    bookmakerOdds: odds,
    distribution,
    tailProbability: tail,
    counterpartOdds: null,
    marginMethod: "MULTIPLICATIVE",
    probabilitySource: "OUTSIDE_FIT",
    staking,
    lowAgreement: false,
  });
  // Manual: win above 2 (incl. tail) => +0.9, exactly 2 => 0, below 2 => -1.
  const pAbove = 1 - poissonCdf(2, 2.7);
  const pPush = poissonPmf(2, 2.7);
  const pBelow = poissonCdf(1, 2.7);
  const manual = pAbove * 0.9 + pPush * 0 - pBelow * 1;
  assert.ok(Math.abs(a.expectedValuePerUnit - manual) < 1e-12);
});

test("quarter line EV uses the two-leg split, and modelProbability sees half wins", () => {
  const { distribution, tail } = poissonVector(2.7);
  const odds = 2.0;
  const a = evaluateSettlementMarket({
    market: "Over 2.25",
    line: 2.25,
    side: "OVER",
    marketType: "ASIAN",
    bookmakerOdds: odds,
    distribution,
    tailProbability: tail,
    counterpartOdds: 1.8,
    marginMethod: "MULTIPLICATIVE",
    probabilitySource: "OUTSIDE_FIT",
    staking,
    lowAgreement: false,
  });
  // goals <= 1: both legs lose (-1); goals == 2: push + loss => -0.5; goals >= 3: both win => +1.
  let manual = 0;
  for (let g = 0; g <= 15; g++) {
    const p = distribution[g];
    manual += p * (g <= 1 ? -1 : g === 2 ? -0.5 : 1);
  }
  manual += tail * 1;
  assert.ok(Math.abs(a.expectedValuePerUnit - manual) < 1e-12);
  // Exactly 2 goals mass must surface as half-win probability.
  assert.ok(Math.abs(a.modelProbability - (1 - poissonCdf(2, 2.7) + 0.5 * poissonPmf(2, 2.7))) < 1e-12);
});

test("kellyFromOutcomeDistribution recovers the binary formula when no push exists", () => {
  const p = 0.6;
  const odds = 2.5;
  const binary = kellyFromOutcomeDistribution({ WIN: p, LOSS: 1 - p }, odds);
  const closedForm = (1.5 * p - (1 - p)) / 1.5;
  assert.ok(Math.abs(binary - closedForm) < 1e-6);
});

/* ------------------------------------------------------------------ */
/* Market-range bracketing rule                                        */
/* ------------------------------------------------------------------ */

const completePair15 = { line: 1.5, under: 3.5, over: 1.35, marketType: "STANDARD" as const };
const completePair35 = { line: 3.5, under: 1.45, over: 2.9, marketType: "STANDARD" as const };

test("market range probability only when bracketing complete anchors exist", () => {
  const onlyOne = extractMarketBoundaries([completePair35]);
  // P(2..3) = P(<=3) - P(<=1): the P(<=1) anchor is missing => null.
  assert.equal(marketRangeProbability(onlyOne, 2, 3), null);

  const both = extractMarketBoundaries([completePair15, completePair35]);
  const range = marketRangeProbability(both, 2, 3);
  assert.ok(range !== null);
  const lower = extractMarketBoundaries([completePair15])[0].probability;
  const upper = extractMarketBoundaries([completePair35])[0].probability;
  assert.ok(Math.abs(range.probability - (upper - lower)) < 1e-12);
});

test("one-sided anchors are never used as market-range brackets", () => {
  const oneSided = extractMarketBoundaries([{ ...completePair15, under: null }]);
  assert.equal(marketRangeProbability(oneSided, 0, 1), null);
});

/* ------------------------------------------------------------------ */
/* Full pipeline composition                                           */
/* ------------------------------------------------------------------ */

function sampleResult(options: CalculationOptions) {
  const markets = [
    completePair15,
    completePair35,
    completePair15.line === 1.5 ? { ...completePair35 } : completePair35,
    { line: 5.5, under: null, over: 4.2, marketType: "STANDARD" as const },
    { line: 2.0, under: 1.95, over: 1.95, marketType: "ASIAN" as const },
  ];
  const input = { markets };
  const result = calculateProbabilities(input, options);
  return { input, result };
}

test("runBettingAnalysis labels fit contribution via market weights", () => {
  const options: CalculationOptions = {
    model: "POISSON",
    marginMethod: "MULTIPLICATIVE",
    maxGoals: 15,
    marketWeights: { completeStandard: 1, completeAsianWhole: 0.8, oneSided: 0 },
  };
  const { input, result } = sampleResult(options);
  const out = runBettingAnalysis(result, input, options, staking);

  const oneSidedRow = out.assessments.find((a) => Math.abs(a.line - 5.5) < 1e-9 && a.side === "OVER");
  assert.ok(oneSidedRow);
  // Weight 0 => excluded from the fit => the model did NOT use this price.
  assert.equal(oneSidedRow.probabilitySource, "OUTSIDE_FIT");

  const standardRow = out.assessments.find((a) => Math.abs(a.line - 1.5) < 1e-9);
  assert.ok(standardRow);
  assert.equal(standardRow.probabilitySource, "SAME_MARKET_FIT");

  // Every quoted side is retained, positive or not.
  assert.equal(out.assessments.length, 7);
  assert.ok(out.rangeComparisons.length === 4);
  assert.ok(out.derivatives.length >= 8);
});

test("range comparisons fill the market side only where brackets exist", () => {
  const options: CalculationOptions = {
    model: "POISSON",
    marginMethod: "MULTIPLICATIVE",
    maxGoals: 15,
  };
  const { result } = sampleResult(options);
  const comparisons = compareModelToMarket(result);
  const twoThree = comparisons.find((c) => c.label === "2-3");
  assert.ok(twoThree);
  // Complete 1.5 and 3.5 pairs bracket 2-3 => market side derivable.
  assert.ok(twoThree.marketProbability !== null);
  const fourFive = comparisons.find((c) => c.label === "4-5");
  assert.ok(fourFive);
  // No 4.5 pair in the sample => market side must be null, never fabricated.
  assert.equal(fourFive.marketProbability, null);
  assert.ok(fourFive.notes.some((n) => /not derivable/.test(n)));
});

test("derivative estimates carry model-only closed forms", () => {
  const options: CalculationOptions = {
    model: "POISSON",
    marginMethod: "MULTIPLICATIVE",
    maxGoals: 15,
  };
  const { result } = sampleResult(options);
  const derivatives = derivativeEstimates(result);
  const twoOrThree = derivatives.find((d) => d.label === "2 or 3 goals");
  assert.ok(twoOrThree);
  assert.equal(twoOrThree.formula, "P(X=2) + P(X=3)");
  const exact = (k: number) => result.exactGoals.find((e) => e.goals === k)?.probability ?? 0;
  assert.ok(Math.abs(twoOrThree.probability - (exact(2) + exact(3))) < 1e-12);
});

test("agreement threshold is a positive finite constant", () => {
  assert.ok(LOW_AGREEMENT_FIT_ERROR > 0 && Number.isFinite(LOW_AGREEMENT_FIT_ERROR));
});
