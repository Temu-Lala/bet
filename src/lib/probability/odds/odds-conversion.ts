/** Odds format conversions. Decimal odds are the canonical internal format. */

export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds <= 1) {
    throw new RangeError(`Decimal odds must be > 1, got ${decimalOdds}`);
  }
  const american = (decimalOdds - 1) * 100;
  return decimalOdds >= 2 ? Math.round(american) : Math.round(-100 / (decimalOdds - 1));
}

export function americanToDecimal(americanOdds: number): number {
  if (americanOdds === 0) {
    throw new RangeError("American odds cannot be 0");
  }
  return americanOdds > 0 ? 1 + americanOdds / 100 : 1 + 100 / Math.abs(americanOdds);
}

/** Decimal odds as a fractional approximation (bet365 style), e.g. 5/2. */
export function decimalToFractional(decimalOdds: number, tolerance = 1e-4): string {
  const target = decimalOdds - 1;
  let bestNum = 1;
  let bestDen = 1;
  let bestError = Infinity;
  for (let den = 1; den <= 50; den++) {
    const num = Math.round(target * den);
    if (num < 1) continue;
    const error = Math.abs(num / den - target);
    if (error < bestError) {
      bestError = error;
      bestNum = num;
      bestDen = den;
    }
    if (bestError < tolerance) break;
  }
  return `${bestNum}/${bestDen}`;
}
