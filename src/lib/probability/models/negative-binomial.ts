import { logGamma } from "../core/numerical-utils";

/**
 * Negative Binomial goal model.
 *
 * Parameterized with mean mu (= expected goals) and dispersion r:
 *
 *   P(X = k) = Gamma(k + r) / (Gamma(r) k!) * (r/(r+mu))^r * (mu/(r+mu))^k
 *
 * Var(X) = mu + mu^2 / r, so smaller r means heavier tails (overdispersion)
 * than Poisson; r -> infinity converges to the Poisson model.
 */
export function negativeBinomialPmf(k: number, mu: number, r: number): number {
  if (!Number.isInteger(k) || k < 0) {
    throw new RangeError(`negativeBinomialPmf requires k >= 0 integer, got ${k}`);
  }
  if (!Number.isFinite(mu) || mu <= 0) {
    throw new RangeError(`Mean must be > 0, got ${mu}`);
  }
  if (!Number.isFinite(r) || r <= 0) {
    throw new RangeError(`Dispersion must be > 0, got ${r}`);
  }
  const p = r / (r + mu); // success probability
  const logPmf =
    logGamma(k + r) - logGamma(r) - logGamma(k + 1) +
    r * Math.log(p) +
    k * Math.log(1 - p);
  return Math.exp(logPmf);
}

export function negativeBinomialCdf(k: number, mu: number, r: number): number {
  let total = 0;
  for (let i = 0; i <= k; i++) total += negativeBinomialPmf(i, mu, r);
  return total;
}
