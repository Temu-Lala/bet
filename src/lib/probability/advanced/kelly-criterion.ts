/**
 * Kelly criterion for a binary back bet.
 *
 *   f* = (b*p - q) / b      where b = O - 1, p = win prob, q = 1 - p
 *
 * The full Kelly fraction is deliberately not recommended as a stake;
 * `fractionalKelly` exposes the common safety scaling.
 */
export function kellyFraction(probability: number, decimalOdds: number): number {
  if (!(probability >= 0 && probability <= 1)) {
    throw new RangeError(`Probability must be in [0, 1], got ${probability}`);
  }
  if (!(decimalOdds > 1)) {
    throw new RangeError(`Decimal odds must be > 1, got ${decimalOdds}`);
  }
  const b = decimalOdds - 1;
  const f = (b * probability - (1 - probability)) / b;
  return Math.max(0, f);
}

export function fractionalKelly(
  probability: number,
  decimalOdds: number,
  fraction = 0.25,
): number {
  return kellyFraction(probability, decimalOdds) * fraction;
}
