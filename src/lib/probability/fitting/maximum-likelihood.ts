import type { MarketBoundary } from "../../../types/probability";
import type { GoalModel } from "../models/model-selector";
import { goldenSectionMinimize } from "./least-squares";
import { LAMBDA_BOUNDS, type LambdaFitResult } from "./lambda-estimator";
import { modelProbability, type BoundaryAnchor } from "../markets/market-boundaries";

/**
 * Alternative fitter: maximize the Bernoulli log-likelihood that treats each
 * anchor as an observed frequency of the event "total goals <= k".
 *
 *   L(lambda) = prod_i F(k_i; lambda)^(w_i p_i) * (1 - F(k_i; lambda))^(w_i (1 - p_i))
 *
 * Anchors from incomplete (one-sided) markets are excluded here because their
 * raw probability cannot be margin-adjusted without the opposite side.
 */
export function fitLambdaMaximumLikelihood(
  anchors: MarketBoundary[] | BoundaryAnchor[],
  model: GoalModel,
  bounds: [number, number] = LAMBDA_BOUNDS,
): LambdaFitResult {
  const usable = anchors.filter((a) => a.complete);
  if (usable.length === 0) {
    throw new RangeError("Maximum-likelihood fitting needs at least one complete market");
  }

  const negLogLik = (lambda: number): number => {
    let ll = 0;
    for (const a of usable) {
      const f = Math.min(
        Math.max(modelProbability(a as BoundaryAnchor, model, lambda), 1e-12),
        1 - 1e-12,
      );
      ll += a.weight * (a.probability * Math.log(f) + (1 - a.probability) * Math.log(1 - f));
    }
    return -ll;
  };

  const optimum = goldenSectionMinimize(negLogLik, bounds);
  // Residual-based RMSE for comparability with the least-squares fitter.
  const totalWeight = usable.reduce((sum, a) => sum + a.weight, 0);
  let sse = 0;
  for (const a of usable) {
    const diff = modelProbability(a as BoundaryAnchor, model, optimum.x) - a.probability;
    sse += a.weight * diff * diff;
  }

  return {
    lambda: optimum.x,
    sse,
    rmse: Math.sqrt(sse / totalWeight),
    iterations: optimum.iterations,
    converged: optimum.converged,
  };
}
