/** Generic probability helpers. All values are decimals in [0, 1]. */

export function clampProbability(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.min(1, Math.max(0, p));
}

export function sumProbabilities(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

/**
 * Renormalize a vector so it sums to exactly 1 (used defensively after
 * truncation). Returns a new array; throws when the input sum is not positive.
 */
export function normalizeDistribution(values: number[]): number[] {
  const total = sumProbabilities(values);
  if (!(total > 0)) {
    throw new RangeError("Cannot normalize a distribution with non-positive total mass");
  }
  return values.map((v) => v / total);
}

/**
 * Distribution health check used before returning any result:
 * every value within [0,1] and total mass within tolerance of 1.
 */
export function validateDistribution(
  probabilities: number[],
  tailProbability = 0,
  tolerance = 1e-8,
): { ok: boolean; total: number; outOfRange: boolean } {
  const outOfRange = probabilities.some((p) => p < 0 || p > 1 || !Number.isFinite(p));
  const total = sumProbabilities(probabilities) + tailProbability;
  return { ok: !outOfRange && Math.abs(total - 1) <= tolerance, total, outOfRange };
}

/** Weighted mean (expected value of a discrete distribution). */
export function expectedValue(probabilities: number[]): number {
  let ev = 0;
  for (let goals = 0; goals < probabilities.length; goals++) {
    ev += goals * probabilities[goals];
  }
  return ev;
}
