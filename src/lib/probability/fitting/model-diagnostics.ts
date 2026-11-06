import type { ModelDiagnostics } from "../../../types/probability";
import type { LambdaFitResult } from "./lambda-estimator";
import type { BoundaryAnchor } from "../markets/market-boundaries";

/**
 * Model diagnostics: turn raw fit numbers into honest, human-readable
 * warnings. Fitting failure and market inconsistency are different events
 * and are reported differently.
 */

export const FIT_ERROR_THRESHOLDS = {
  good: 0.02, // weighted RMSE <= 2 percentage points
  concerning: 0.06,
};

export function buildDiagnostics(
  modelName: string,
  fit: LambdaFitResult,
  anchors: BoundaryAnchor[],
  marketWarnings: string[],
): ModelDiagnostics {
  const warnings = [...marketWarnings];

  if (!fit.converged) {
    warnings.push("Optimizer did not converge within the iteration budget; lambda estimate is approximate");
  }

  if (fit.lambda >= 7.95) {
    warnings.push("Fitted lambda hit the upper search bound; entering odds may be inconsistent");
  }
  if (fit.lambda <= 0.055) {
    warnings.push("Fitted lambda hit the lower search bound; entering odds may be inconsistent");
  }

  if (fit.rmse > FIT_ERROR_THRESHOLDS.good) {
    warnings.push(
      `Markets and the ${modelName} model do not agree perfectly (weighted RMSE ${(fit.rmse * 100).toFixed(2)} percentage points); probabilities are a best compromise, not an exact recovery`,
    );
  }

  const incomplete = anchors.filter((a) => !a.complete).length;
  if (incomplete > 0) {
    warnings.push(
      `${incomplete} market${incomplete === 1 ? "" : "s"} used one-sided raw prices (down-weighted, margin not removable)`,
    );
  }

  return {
    model: modelName,
    lambda: fit.lambda,
    fittingError: fit.rmse,
    marketCount: anchors.length,
    warnings,
  };
}
