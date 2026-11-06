import { poissonDistribution } from "./poisson-model";
import { selectModel, type GoalModel } from "./model-selector";
import { fitLambdaLeastSquares, type LambdaFitResult } from "../fitting/lambda-estimator";
import { modelProbability, type BoundaryAnchor } from "../markets/market-boundaries";
import type { GoalDistribution } from "../../../types/model";

/**
 * Fitted Poisson pipeline piece: distribution whose lambda has been
 * estimated from bookmaker anchors rather than assumed.
 */
export interface FittedModel {
  model: GoalModel;
  fit: LambdaFitResult;
  distribution: GoalDistribution;
  /** Per-anchor residuals: market probability vs fitted model probability. */
  residuals: {
    line: number;
    k: number;
    market: number;
    fitted: number;
    difference: number;
  }[];
}

export function fitModelToMarkets(
  anchors: BoundaryAnchor[],
  kind: "POISSON" | "NEGATIVE_BINOMIAL",
  maxGoals: number,
  nbDispersion?: number,
): FittedModel {
  const model = selectModel(kind, nbDispersion);
  const fit = fitLambdaLeastSquares(anchors, model);

  const probabilities: number[] = [];
  for (let k = 0; k <= maxGoals; k++) probabilities.push(model.pmf(k, fit.lambda));
  const tail = Math.max(0, 1 - model.cdf(maxGoals, fit.lambda));

  const distribution: GoalDistribution = {
    model: kind,
    probabilities,
    tailProbability: tail,
    expectedGoals: fit.lambda,
    lambda: fit.lambda,
  };

  const residuals = anchors.map((anchor) => {
    const fitted = modelProbability(anchor, model, fit.lambda);
    return {
      line: anchor.line,
      k: anchor.k,
      market: anchor.probability,
      fitted,
      difference: fitted - anchor.probability,
    };
  });

  return { model, fit, distribution, residuals };
}

// Keep the pure Poisson builder reachable from this module as well.
export { poissonDistribution };
