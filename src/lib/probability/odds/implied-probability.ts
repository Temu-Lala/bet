/**
 * Odds <-> probability conversion.
 *
 *   P_raw = 1 / O        (decimal odds -> raw implied probability)
 *
 * For Under 1.5 = 3.75:  P_raw = 1/3.75 = 26.67%
 * For Over  1.5 = 1.28:  P_raw = 1/1.28 = 78.13%
 *
 * These are RAW implied probabilities: they still contain the bookmaker
 * margin and are never presented as "true" probabilities.
 */

export function impliedProbability(decimalOdds: number): number {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) {
    throw new RangeError(
      `Decimal odds must be greater than 1.00, got ${decimalOdds}`,
    );
  }
  return 1 / decimalOdds;
}

/** Inverse operation: probability -> decimal odds. */
export function oddsFromProbability(probability: number): number {
  if (!(probability > 0) || probability >= 1 || !Number.isFinite(probability)) {
    throw new RangeError(
      `Probability must be in (0, 1), got ${probability}`,
    );
  }
  return 1 / probability;
}
