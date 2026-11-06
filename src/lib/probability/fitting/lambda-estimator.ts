import type { MarketBoundary } from "../../../types/probability";
import type { GoalModel } from "../models/model-selector";
import { goldenSectionMinimize } from "./least-squares";
import { modelProbability, type BoundaryAnchor } from "../markets/market-boundaries";

/**
 * Estimate the scoring rate lambda from margin-removed market anchors by
 * minimizing the weighted least-squares objective:
 *
 *   lambda* = argmin_{lambda > 0}  sum_i w_i * (F(k_i; lambda) - P_i)^2
 *
 * Solved with a bounded golden-section search: the objective is smooth and
 * (for these anchor sets) effectively unimodal over the plausible range.
 *
 * Modeling rule: markets may disagree with each other and with the model.
 * The fit error is reported honestly instead of pretending a perfect match
 * exists.
 */
export interface LambdaFitResult {
  lambda: number;
  /** Weighted sum of squared residuals at the optimum. */
  sse: number;
  /** Weighted root-mean-square error, surfaced as diagnostics.fittingError. */
  rmse: number;
  iterations: number;
  converged: boolean;
}

export const LAMBDA_BOUNDS: [number, number] = [0.05, 8];

export function fitLambdaLeastSquares(
  anchors: MarketBoundary[] | BoundaryAnchor[],
  model: GoalModel,
  bounds: [number, number] = LAMBDA_BOUNDS,
): LambdaFitResult {
  if (anchors.length === 0) {
    throw new RangeError("Lambda estimation requires at least one market anchor");
  }

  const totalWeight = anchors.reduce((sum, a) => sum + a.weight, 0);

  const objective = (lambda: number): number => {
    let sse = 0;
    for (const anchor of anchors) {
      const diff =
        modelProbability(anchor as BoundaryAnchor, model, lambda) - anchor.probability;
      sse += anchor.weight * diff * diff;
    }
    return sse;
  };

  const optimum = goldenSectionMinimize(objective, bounds);
  const rmse = Math.sqrt(optimum.fx / totalWeight);

  return {
    lambda: optimum.x,
    sse: optimum.fx,
    rmse,
    iterations: optimum.iterations,
    converged: optimum.converged,
  };
}
