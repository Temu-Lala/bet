import { poissonPmf } from "../core/poisson-pmf";
import { poissonCdf } from "../core/poisson-cdf";
import { negativeBinomialPmf, negativeBinomialCdf } from "./negative-binomial";

/**
 * A minimal model interface the fitter and distribution builder can share.
 * `lambda` is the mean scoring rate for every supported model.
 */
export interface GoalModel {
  name: "POISSON" | "NEGATIVE_BINOMIAL";
  /** Default dispersion used when the model has one (NB). */
  dispersion: number;
  pmf(k: number, lambda: number): number;
  cdf(k: number, lambda: number): number;
}

const POISSON_MODEL: GoalModel = {
  name: "POISSON",
  dispersion: Infinity,
  pmf: (k, lambda) => poissonPmf(k, lambda),
  cdf: (k, lambda) => poissonCdf(k, lambda),
};

export const DEFAULT_NB_DISPERSION = 6; // Var = mu + mu^2/6: mild overdispersion

function makeNegativeBinomialModel(r: number): GoalModel {
  return {
    name: "NEGATIVE_BINOMIAL",
    dispersion: r,
    pmf: (k, lambda) => negativeBinomialPmf(k, lambda, r),
    cdf: (k, lambda) => negativeBinomialCdf(k, lambda, r),
  };
}

export function selectModel(
  kind: "POISSON" | "NEGATIVE_BINOMIAL",
  nbDispersion = DEFAULT_NB_DISPERSION,
): GoalModel {
  switch (kind) {
    case "POISSON":
      return POISSON_MODEL;
    case "NEGATIVE_BINOMIAL":
      return makeNegativeBinomialModel(nbDispersion);
    default:
      throw new RangeError(`Unknown model kind: ${kind}`);
  }
}
