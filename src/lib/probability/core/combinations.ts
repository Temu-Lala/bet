/** Binomial coefficient C(n, k) using a stable multiplicative form. */
export function combinations(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) {
    throw new RangeError(`combinations requires 0 <= k <= n, got C(${n},${k})`);
  }
  const effectiveK = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= effectiveK; i++) {
    result = (result * (n - effectiveK + i)) / i;
  }
  return Math.round(result);
}
