import test from "node:test";
import assert from "node:assert/strict";

import {
  settleAsianPosition,
  settlementProbabilities,
  splitQuarterLine,
  isQuarterLine,
  isWholeLine,
  type AsianPosition,
} from "../../../src/lib/probability/odds/asian-settlement";

/**
 * Spec section 13 reference cases for the Asian line Over 5.0:
 *   5 goals -> PUSH, 6 goals -> WIN, 4 goals -> LOSS.
 */

const overFive: AsianPosition = { line: 5.0, side: "OVER", odds: 11.5, stake: 100 };

test("whole line 5.0: exactly 5 goals is a push (stake returned)", () => {
  const outcome = settleAsianPosition(5, overFive);
  assert.equal(outcome.outcome, "PUSH");
  assert.equal(outcome.profit, 0);
  assert.equal(outcome.profitFactor, 0);
});

test("whole line 5.0: 6 goals wins at full odds", () => {
  const outcome = settleAsianPosition(6, overFive);
  assert.equal(outcome.outcome, "WIN");
  assert.ok(Math.abs(outcome.profit - 100 * 10.5) < 1e-9);
});

test("whole line 5.0: 4 goals loses the stake", () => {
  const outcome = settleAsianPosition(4, overFive);
  assert.equal(outcome.outcome, "LOSS");
  assert.equal(outcome.profit, -100);
  assert.equal(outcome.profitFactor, -1);
});

test("mirror symmetry: under 5.0 pushes at 5 and wins at 4", () => {
  const underFive: AsianPosition = { line: 5.0, side: "UNDER", odds: 1.5, stake: 50 };
  assert.equal(settleAsianPosition(5, underFive).outcome, "PUSH");
  assert.equal(settleAsianPosition(4, underFive).outcome, "WIN");
  assert.equal(settleAsianPosition(6, underFive).outcome, "LOSS");
});

test("half line 2.5 has no push possibility", () => {
  const overTwoFive: AsianPosition = { line: 2.5, side: "OVER", odds: 2, stake: 10 };
  assert.equal(settleAsianPosition(2, overTwoFive).outcome, "LOSS");
  assert.equal(settleAsianPosition(3, overTwoFive).outcome, "WIN");
});

test("quarter line 2.25 over: 2 goals half-loses, 3 goals full-wins", () => {
  const quarter: AsianPosition = { line: 2.25, side: "OVER", odds: 2.0, stake: 100 };
  const two = settleAsianPosition(2, quarter);
  assert.equal(two.outcome, "HALF_LOSS");
  assert.equal(two.profit, -50); // half the stake lost on the 2.5 leg
  assert.equal(two.details.length, 2);

  const three = settleAsianPosition(3, quarter);
  assert.equal(three.outcome, "WIN");
  assert.equal(three.profit, 100); // (2.0 - 1) * 100
});

test("quarter line 2.75 over: 3 goals half-wins (push + win legs)", () => {
  const quarter: AsianPosition = { line: 2.75, side: "OVER", odds: 2.0, stake: 100 };
  const three = settleAsianPosition(3, quarter);
  assert.equal(three.outcome, "HALF_WIN");
  assert.equal(three.profit, 50);
});

test("splitQuarterLine maps to the adjacent half lines", () => {
  assert.deepEqual(splitQuarterLine(2.25), [2, 2.5]);
  assert.deepEqual(splitQuarterLine(2.75), [2.5, 3]);
});

test("line classification helpers", () => {
  assert.equal(isQuarterLine(2.25), true);
  assert.equal(isQuarterLine(2.5), false);
  assert.equal(isQuarterLine(2.0), false);
  assert.equal(isWholeLine(5), true);
  assert.equal(isWholeLine(5.5), false);
});

test("settlement probabilities cover the full distribution mass", () => {
  // Simple synthetic distribution over 0..7 goals.
  const distribution = [0.05, 0.1, 0.15, 0.2, 0.18, 0.12, 0.1, 0.1];
  const probs = settlementProbabilities(overFive, distribution, 0);
  const sum = Object.values(probs).reduce((s, p) => s + p, 0);
  assert.ok(Math.abs(sum - 1) < 1e-12);
  assert.ok(Math.abs(probs.PUSH - 0.12) < 1e-12); // P(X = 5)
  assert.ok(Math.abs(probs.WIN - 0.2) < 1e-12); // P(6) + P(7)
  assert.ok(Math.abs(probs.LOSS - 0.68) < 1e-12); // P(0..4)
});

test("tail mass is attributed to the far-field outcome, not dropped", () => {
  // Distribution + tail must form one probability measure: 0.7 mass on 0
  // goals, nothing up to 5, 0.3 retained tail beyond the distribution.
  const distribution = new Array(6).fill(0);
  distribution[0] = 0.7;
  const probs = settlementProbabilities(overFive, distribution, 0.3);
  assert.ok(Math.abs(probs.WIN - 0.3) < 1e-12); // everything beyond line wins
  assert.ok(Math.abs(probs.LOSS - 0.7) < 1e-12);
  assert.equal(probs.PUSH, 0); // no mass exactly at 5 goals
});

test("negative goal counts are rejected instead of guessed", () => {
  assert.throws(() => settleAsianPosition(-1, overFive), RangeError);
});
