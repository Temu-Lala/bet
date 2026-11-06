/**
 * Expected value of a back bet at fixed decimal odds.
 *
 *   EV = P(win) * (O - 1) - P(lose)          (per unit staked)
 *
 * For asian positions with push outcomes use `expectedValue` from
 * odds/asian-settlement.ts instead; this formula assumes a binary
 * win/loss market (1X2, BTTS, .5 lines).
 */
export function expectedValuePerUnit(probability: number, decimalOdds: number): number {
  if (!(probability >= 0 && probability <= 1)) {
    throw new RangeError(`Probability must be in [0, 1], got ${probability}`);
  }
  if (!(decimalOdds > 1)) {
    throw new RangeError(`Decimal odds must be > 1, got ${decimalOdds}`);
  }
  return probability * (decimalOdds - 1) - (1 - probability);
}

/** Fair odds implied by the model probability. */
export function fairOddsFromProbability(probability: number): number {
  if (!(probability > 0 && probability < 1)) {
    throw new RangeError(`Probability must be in (0, 1), got ${probability}`);
  }
  return 1 / probability;
}
