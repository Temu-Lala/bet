import test from "node:test";
import assert from "node:assert/strict";

import { poissonPmf, poissonPmfVector } from "../../../src/lib/probability/core/poisson-pmf";
import {
  poissonCdf,
  poissonSf,
  poissonBetween,
} from "../../../src/lib/probability/core/poisson-cdf";

/**
 * Reference values from the architecture specification, section 13
 * ("test the formulas"): Poisson(1) P(X=0) = e^-1 = 36.79%.
 */

test("poissonPmf(0, 1) equals e^-1 to machine precision", () => {
  assert.ok(Math.abs(poissonPmf(0, 1) - Math.exp(-1)) < 1e-15);
});

test("poissonPmf(1, 1) equals e^-1 (mean equals variance at lambda 1)", () => {
  // k = 1 goes through the log-space path, so the tolerance reflects
  // Lanczos logGamma accuracy rather than bit-exactness.
  assert.ok(Math.abs(poissonPmf(1, 1) - Math.exp(-1)) < 1e-12);
});

test("poissonPmf(2, 3) matches the closed form e^-3 * 9 / 2", () => {
  assert.ok(Math.abs(poissonPmf(2, 3) - (Math.exp(-3) * 9) / 2) < 1e-12);
});

test("pmf vector over 0..40 sums to 1 for a moderate lambda", () => {
  const sum = poissonPmfVector(40, 2.5).reduce((s, p) => s + p, 0);
  assert.ok(Math.abs(sum - 1) < 1e-10, `sum was ${sum}`);
});

test("cdf is the running sum of the pmf", () => {
  const lambda = 1.7;
  const expected = poissonPmf(0, lambda) + poissonPmf(1, lambda);
  assert.ok(Math.abs(poissonCdf(1, lambda) - expected) < 1e-12);
});

test("sf(k) = 1 - cdf(k-1) (survival convention P(X >= k))", () => {
  const lambda = 2.2;
  assert.ok(Math.abs(poissonSf(3, lambda) - (1 - poissonCdf(2, lambda))) < 1e-12);
  assert.equal(poissonSf(0, lambda), 1);
});

test("between aggregates inclusive ranges against cdf differences", () => {
  const lambda = 1.4;
  const p23 = poissonBetween(2, 3, lambda);
  const manual = poissonPmf(2, lambda) + poissonPmf(3, lambda);
  assert.ok(Math.abs(p23 - manual) < 1e-12);
});

test("open-ended between equals the survival function", () => {
  const lambda = 1.4;
  assert.ok(
    Math.abs(poissonBetween(4, Infinity, lambda) - poissonSf(4, lambda)) < 1e-12,
  );
});

test("invalid arguments raise RangeErrors instead of NaN", () => {
  assert.throws(() => poissonPmf(-1, 1), RangeError);
  assert.throws(() => poissonPmf(1.5, 1), RangeError);
  assert.throws(() => poissonPmf(0, 0), RangeError);
  assert.throws(() => poissonCdf(1, -2), RangeError);
});
