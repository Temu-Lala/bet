/**
 * Core numerical helpers for the probability engine.
 * Pure TypeScript — no runtime dependency on React, Next.js or browser APIs.
 */

/**
 * Log-gamma via the Lanczos approximation (g=7, n=9 coefficients).
 * Used so Poisson/Negative-Binomial probabilities stay numerically stable
 * well beyond the range where factorial() overflows.
 */
export function logGamma(x: number): number {
  if (x <= 0 || !Number.isFinite(x)) {
    throw new RangeError(`logGamma requires a positive finite argument, got ${x}`);
  }
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  const g = 7;
  if (x < 0.5) {
    // Reflection formula: Gamma(x) * Gamma(1-x) = pi / sin(pi x)
    return (
      Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
    );
  }
  const z = x - 1;
  let a = coefficients[0];
  const t = z + g + 0.5;
  for (let i = 1; i < coefficients.length; i++) {
    a += coefficients[i] / (z + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Numerically tolerant membership helpers. */
export function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
