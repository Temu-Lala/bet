import test from "node:test";
import assert from "node:assert/strict";

import {
  extractMarketBoundaries,
  DEFAULT_MARKET_WEIGHTS,
} from "../../../src/lib/probability/markets/market-boundaries";
import {
  calculateProbabilities,
  CalculationError,
} from "../../../src/lib/probability/pipeline/calculation-engine";
import type { MarketOdds } from "../../../src/types/probability";
import type { CalculationOptions } from "../../../src/types/odds";

const options: CalculationOptions = {
  model: "POISSON",
  marginMethod: "MULTIPLICATIVE",
  maxGoals: 15,
};

const completePair: MarketOdds = { line: 1.5, under: 3.75, over: 1.28, marketType: "STANDARD" };
const asianWholePair: MarketOdds = { line: 5.0, under: 2.05, over: 2.05, marketType: "ASIAN" };
const oneSided: MarketOdds = { line: 3.5, under: 1.38, over: null, marketType: "STANDARD" };

test("default weights match the engine policy: 1.0 / 0.8 / 0.3", () => {
  const anchors = extractMarketBoundaries([completePair, asianWholePair, oneSided]);
  const byLine = new Map(anchors.map((a) => [a.line, a]));
  assert.equal(byLine.get(1.5)!.weight, 1.0);
  assert.equal(byLine.get(5.0)!.weight, 0.8);
  assert.equal(byLine.get(3.5)!.weight, 0.3);
  assert.deepEqual(DEFAULT_MARKET_WEIGHTS, {
    completeStandard: 1.0,
    completeAsianWhole: 0.8,
    oneSided: 0.3,
  });
});

test("custom category weights are honored", () => {
  const anchors = extractMarketBoundaries(
    [completePair, oneSided],
    "MULTIPLICATIVE",
    { oneSided: 0.9, completeStandard: 0.5 },
  );
  const byLine = new Map(anchors.map((a) => [a.line, a]));
  assert.equal(byLine.get(3.5)!.weight, 0.9);
  assert.equal(byLine.get(1.5)!.weight, 0.5);
});

test("invalid weights fall back to defaults instead of guessing", () => {
  const anchors = extractMarketBoundaries([completePair, oneSided], "MULTIPLICATIVE", {
    completeStandard: Number.NaN,
    oneSided: -1,
  });
  const byLine = new Map(anchors.map((a) => [a.line, a]));
  assert.equal(byLine.get(1.5)!.weight, DEFAULT_MARKET_WEIGHTS.completeStandard);
  assert.equal(byLine.get(3.5)!.weight, DEFAULT_MARKET_WEIGHTS.oneSided);
});

test("a zero one-sided weight excludes it from the fit but keeps it visible", () => {
  const withIgnored = calculateProbabilities(
    { markets: [completePair, oneSided] },
    { ...options, marketWeights: { ...DEFAULT_MARKET_WEIGHTS, oneSided: 0 } },
  );
  const pairOnly = calculateProbabilities({ markets: [completePair] }, options);

  // The ignored market must not influence lambda at all.
  assert.ok(
    Math.abs(withIgnored.diagnostics.lambda - pairOnly.diagnostics.lambda) < 1e-6,
    "zero-weight market still affected the fit",
  );

  // It stays in the boundary list, labeled, and the exclusion is disclosed.
  assert.equal(withIgnored.marketBoundaries.length, 2);
  const ignored = withIgnored.marketBoundaries.find((a) => a.line === 3.5);
  assert.equal(ignored!.weight, 0);
  assert.ok(
    withIgnored.diagnostics.warnings.some((w) => /excluded from the fit/.test(w)),
    "exclusion must be disclosed in warnings",
  );
});

test("relative weights change the fit outcome measurably", () => {
  const baseline = calculateProbabilities({ markets: [completePair, oneSided] }, options);
  const boosted = calculateProbabilities(
    { markets: [completePair, oneSided] },
    { ...options, marketWeights: { oneSided: 2 } },
  );
  assert.notEqual(baseline.diagnostics.lambda, boosted.diagnostics.lambda);
});

test("zeroing every weight is blocked, not silently fitted to nothing", () => {
  assert.throws(
    () =>
      calculateProbabilities(
        { markets: [completePair, oneSided] },
        {
          ...options,
          marketWeights: { completeStandard: 0, completeAsianWhole: 0, oneSided: 0 },
        },
      ),
    (err: unknown) => err instanceof CalculationError,
  );
});
