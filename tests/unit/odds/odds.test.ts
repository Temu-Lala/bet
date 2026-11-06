import test from "node:test";
import assert from "node:assert/strict";

import {
  impliedProbability,
  oddsFromProbability,
} from "../../../src/lib/probability/odds/implied-probability";
import {
  removeMarginTwoWay,
  removeMarginMultiplicative,
} from "../../../src/lib/probability/odds/margin-removal";
import { overround } from "../../../src/lib/probability/odds/overround";

/**
 * Spec section 13 reference cases:
 *   decimal 2.00  ->  50.00%
 *   U1.5 = 3.75 / O1.5 = 1.28  ->  margin-removed under 25.45%
 */

test("impliedProbability(2.00) is exactly 0.5", () => {
  assert.equal(impliedProbability(2.0), 0.5);
});

test("raw implied probabilities contain the margin (1.9/1.9 sums above 1)", () => {
  const total = impliedProbability(1.9) + impliedProbability(1.9);
  assert.ok(total > 1 && total < 1.1);
});

test("odds <= 1.00 are rejected as invalid, not silently clamped", () => {
  assert.throws(() => impliedProbability(1.0), RangeError);
  assert.throws(() => impliedProbability(0.5), RangeError);
  assert.throws(() => impliedProbability(Number.NaN), RangeError);
});

test("oddsFromProbability is the exact inverse", () => {
  assert.equal(oddsFromProbability(0.25), 4);
  assert.ok(Math.abs(oddsFromProbability(impliedProbability(3.75)) - 3.75) < 1e-12);
  assert.throws(() => oddsFromProbability(0), RangeError);
  assert.throws(() => oddsFromProbability(1), RangeError);
});

test("multiplicative removal of 3.75 / 1.28 gives under = 25.45%", () => {
  const { under } = removeMarginTwoWay(3.75, 1.28, "MULTIPLICATIVE");
  assert.ok(Math.abs(under - 0.2545) < 5e-5, `under was ${under}`);
});

test("every margin method returns a distribution summing to 1", () => {
  for (const method of ["MULTIPLICATIVE", "ADDITIVE", "POWER"] as const) {
    const { under, over } = removeMarginTwoWay(3.75, 1.28, method);
    assert.ok(Math.abs(under + over - 1) < 1e-12, `${method} sum broken`);
    assert.ok(under > 0 && under < 1 && over > 0 && over < 1);
  }
});

test("multiplicative removal keeps the under/over ratio of the raw odds", () => {
  const { under, over } = removeMarginTwoWay(3.75, 1.28, "MULTIPLICATIVE");
  const rawRatio = impliedProbability(3.75) / impliedProbability(1.28);
  assert.ok(Math.abs(under / over - rawRatio) < 1e-12);
});

test("removeMarginMultiplicative normalizes an arbitrary set", () => {
  const result = removeMarginMultiplicative([0.5, 0.4, 0.2]);
  const sum = result.reduce((s, p) => s + p, 0);
  assert.ok(Math.abs(sum - 1) < 1e-12);
  assert.ok(Math.abs(result[0] - 0.5 / 1.1) < 1e-12);
  assert.throws(() => removeMarginMultiplicative([0, 0]), RangeError);
});

test("overround reports the bookmaker margin excess", () => {
  assert.ok(Math.abs(overround([2.0, 2.0]) - 0) < 1e-12); // fair 50/50 book
  const margin = overround([1.9, 1.9]);
  assert.ok(margin > 0.04 && margin < 0.06, `margin was ${margin}`);
});
