import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateProbabilities,
  CalculationError,
} from "../../../src/lib/probability/pipeline/calculation-engine";
import { sampleMarketOdds } from "../../../src/lib/probability/markets/goal-markets";
import {
  calculateGoalRange,
  DEFAULT_GOAL_RANGES,
} from "../../../src/lib/probability/ranges/goal-range-calculator";
import type { CalculationOptions, OddsInput } from "../../../src/types";

const options: CalculationOptions = {
  model: "POISSON",
  marginMethod: "MULTIPLICATIVE",
  maxGoals: 15,
};

function sampleInput(): OddsInput {
  return { teamName: "Sample Team", bookmaker: "Sample Book", markets: sampleMarketOdds() };
}

test("sample odds produce a distribution whose ranges sum to 100%", () => {
  const result = calculateProbabilities(sampleInput(), options);

  const rangeSum = result.goalRanges.reduce((s, r) => s + r.probability, 0);
  assert.ok(Math.abs(rangeSum - 1) < 1e-8, `ranges summed to ${rangeSum}`);
  assert.ok(Math.abs(result.totalProbability - 1) < 1e-8);
});

test("the four default ranges are reported in order", () => {
  const result = calculateProbabilities(sampleInput(), options);
  assert.deepEqual(
    result.goalRanges.map((r) => r.label),
    DEFAULT_GOAL_RANGES.map((r) => r.label),
  );
});

test("range probabilities match manual aggregation of exact goals", () => {
  const result = calculateProbabilities(sampleInput(), options);

  const p01 =
    result.exactGoals[0].probability + result.exactGoals[1].probability;
  assert.ok(
    Math.abs(result.goalRanges[0].probability - p01) < 1e-12,
  );

  // 6+ absorbs both its exact rows and the retained tail.
  const p6plus =
    result.exactGoals
      .slice(6)
      .reduce((s, g) => s + g.probability, 0) + result.tailProbability;
  assert.ok(Math.abs(result.goalRanges[3].probability - p6plus) < 1e-10);
});

test("expected goals and lambda are consistent and plausible", () => {
  const result = calculateProbabilities(sampleInput(), options);
  assert.ok(result.expectedGoals > 0.5 && result.expectedGoals < 6);
  assert.ok(
    Math.abs(result.diagnostics.lambda - result.expectedGoals) < 1e-6,
    "for Poisson, lambda is the mean",
  );
});

test("cumulative probabilities are monotone non-decreasing in k", () => {
  const result = calculateProbabilities(sampleInput(), options);
  const keys = Object.keys(result.cumulativeProbabilities)
    .map((k) => Number.parseInt(k.replace(/\D/g, ""), 10))
    .sort((a, b) => a - b);
  for (let i = 1; i < keys.length; i++) {
    const prev = result.cumulativeProbabilities[`P(X<=${keys[i - 1]})`];
    const next = result.cumulativeProbabilities[`P(X<=${keys[i]})`];
    assert.ok(next - prev >= -1e-12, `P(X<=${keys[i]}) < P(X<=${keys[i - 1]})`);
  }
});

test("negative binomial model also completes with sane mass", () => {
  const result = calculateProbabilities(sampleInput(), {
    ...options,
    model: "NEGATIVE_BINOMIAL",
  });
  const rangeSum = result.goalRanges.reduce((s, r) => s + r.probability, 0);
  assert.ok(Math.abs(rangeSum - 1) < 1e-8);
});

test("empty input is blocked with a CalculationError, never a zero result", () => {
  assert.throws(
    () => calculateProbabilities({ markets: [] }, options),
    (err: unknown) => err instanceof CalculationError,
  );
});

test("invalid odds are rejected explicitly", () => {
  const bad: OddsInput = {
    markets: [{ line: 1.5, under: 0.5, over: 3.0, marketType: "STANDARD" }],
  };
  assert.throws(
    () => calculateProbabilities(bad, options),
    (err: unknown) => err instanceof CalculationError,
  );
});

test("one-sided markets alongside a complete pair are used and disclosed", () => {
  const mixed: OddsInput = {
    markets: [
      { line: 1.5, under: 3.75, over: 1.28, marketType: "STANDARD" },
      { line: 2.5, under: null, over: 2.0, marketType: "STANDARD" },
    ],
  };
  const result = calculateProbabilities(mixed, options);
  assert.ok(
    result.diagnostics.warnings.length > 0,
    "one-sided usage must be disclosed",
  );
});

test("one-sided-only input is blocked rather than guessed at", () => {
  const onlyOneSided: OddsInput = {
    markets: [
      { line: 1.5, under: null, over: 1.28, marketType: "STANDARD" },
      { line: 3.5, under: 1.38, over: null, marketType: "STANDARD" },
    ],
  };
  assert.throws(
    () => calculateProbabilities(onlyOneSided, options),
    (err: unknown) =>
      err instanceof CalculationError &&
      err.issues.some((i) => /complete|both sides/i.test(i)),
  );
});

test("calculateGoalRange aggregates inclusively and honors open ends", () => {
  const probabilities = [0.1, 0.2, 0.3, 0.25, 0.1, 0.04];
  assert.ok(Math.abs(calculateGoalRange(probabilities, { label: "0-1", min: 0, max: 1 }) - 0.3) < 1e-12);
  assert.ok(
    Math.abs(
      calculateGoalRange(probabilities, { label: "4+", min: 4, max: null }, 0.01) - 0.15,
    ) < 1e-12,
  );
});
