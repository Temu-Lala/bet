import { impliedProbability } from "./implied-probability";

/**
 * Bookmaker overround (the built-in margin).
 *
 *   overround = sum(1/O_i) - 1
 *
 * For a fair market the sum of implied probabilities is exactly 1 and the
 * overround is 0. Typical two-way goal markets sit around 2-6%.
 */
export function overround(decimalOdds: number[]): number {
  if (decimalOdds.length < 2) {
    throw new RangeError("Overround requires at least two prices");
  }
  return decimalOdds.reduce((sum, o) => sum + impliedProbability(o), 0) - 1;
}

/** Fair-odds recomputation: strip the margin from a full set of prices. */
export function fairOdds(decimalOdds: number[]): number[] {
  const total = decimalOdds.reduce((sum, o) => sum + impliedProbability(o), 0);
  return decimalOdds.map((o) => o * total);
}
