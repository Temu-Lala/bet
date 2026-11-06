import { logGamma } from "./numerical-utils";

/**
 * Poisson probability mass function.
 *
 *   P(X = k) = e^(-lambda) * lambda^k / k!
 *
 * Evaluated in log space for numerical stability:
 *   log P = -lambda + k*ln(lambda) - lnGamma(k+1)
 */
export function poissonPmf(k: number, lambda: number): number {
  if (!Number.isInteger(k) || k < 0) {
    throw new RangeError(`poissonPmf requires k >= 0 integer, got ${k}`);
  }
  if (!Number.isFinite(lambda) || lambda <= 0) {
    throw new RangeError(`poissonPmf requires lambda > 0, got ${lambda}`);
  }
  if (k === 0) return Math.exp(-lambda);
  const logP = -lambda + k * Math.log(lambda) - logGamma(k + 1);
  return Math.exp(logP);
}

/** Vector of Poisson probabilities for exactly 0..maxGoals goals. */
export function poissonPmfVector(maxGoals: number, lambda: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= maxGoals; k++) out.push(poissonPmf(k, lambda));
  return out;
}
