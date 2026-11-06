import { poissonPmf } from "./poisson-pmf";

/**
 * Poisson cumulative distribution function.
 *
 *   F(k; lambda) = P(X <= k) = P(X=0) + P(X=1) + ... + P(X=k)
 *
 * Examples used by the market boundary layer:
 *   Under 1.5  ->  P(X <= 1)
 *   Under 3.5  ->  P(X <= 3)
 */
export function poissonCdf(k: number, lambda: number): number {
  if (!Number.isInteger(k) || k < 0) {
    // P(X <= -1) is definitionally zero (goal counts are non-negative).
    if (Number.isInteger(k) && k < 0) return 0;
    throw new RangeError(`poissonCdf requires integer k, got ${k}`);
  }
  let total = 0;
  for (let i = 0; i <= k; i++) total += poissonPmf(i, lambda);
  return total;
}

/** P(X >= k) = 1 - P(X <= k-1), with the boundary convention P(X >= 0) = 1. */
export function poissonSf(k: number, lambda: number): number {
  if (k <= 0) return 1;
  return 1 - poissonCdf(k - 1, lambda);
}

/** P(X = k) expressed via the CDF difference; kept for range aggregation. */
export function poissonBetween(
  min: number,
  max: number,
  lambda: number,
): number {
  if (max === Infinity) return poissonSf(min, lambda);
  return poissonCdf(max, lambda) - (min > 0 ? poissonCdf(min - 1, lambda) : 0);
}
