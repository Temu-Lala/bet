import type { OddsInput, ProbabilityResult } from "../../../types/probability";
import type { CalculationOptions } from "../../../types/odds";
import {
  stage1Normalize,
  stage2ExtractBoundaries,
  stage3Fit,
} from "./calculation-pipeline";
import { buildProbabilityResult } from "./result-builder";
import { buildDiagnostics } from "../fitting/model-diagnostics";

/**
 * The single calculation entry point the frontend should call.
 *
 * Sequence (architecture section 3):
 *   1. validate + normalize input          (errors block calculation)
 *   2-3. implied probability + margin removal
 *   4. market boundary extraction
 *   5. statistical model fitting (lambda)
 *   6. exact goal distribution 0..maxGoals (+ retained tail)
 *   7. range aggregation (0-1, 2-3, 4-5, 6+)
 *   8. validation + result generation
 */

export class CalculationError extends Error {
  issues: string[];
  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "CalculationError";
    this.issues = issues;
  }
}

export function calculateProbabilities(
  input: OddsInput,
  options: CalculationOptions,
): ProbabilityResult {
  // 1. Validate and normalize input.
  const stage1 = stage1Normalize(input.markets);
  const blocking = stage1.validationIssues.filter((i) => i.severity === "error");
  if (blocking.length > 0) {
    throw new CalculationError(
      "Odds input cannot be calculated",
      blocking.map((i) => `${i.field}: ${i.message}`),
    );
  }

  // 2-4. Implied probability, margin removal, boundary extraction.
  const { anchors, consistencyWarnings } = stage2ExtractBoundaries(
    stage1.markets,
    options.marginMethod,
    options.marketWeights,
  );
  if (anchors.length === 0) {
    throw new CalculationError("No usable market data after normalization", []);
  }

  // Zero-weight categories (explicit user choice) stay visible for
  // presentation but are excluded from the fit.
  const fitAnchors = anchors.filter((a) => a.weight > 0);
  if (fitAnchors.length === 0) {
    throw new CalculationError(
      "Every market has zero reliability weight — nothing left to fit",
      [],
    );
  }
  const weightWarnings =
    fitAnchors.length < anchors.length
      ? [
          `${anchors.length - fitAnchors.length} market(s) excluded from the fit (zero reliability weight)`,
        ]
      : [];

  // 5. Fit the selected statistical model.
  const fitted = stage3Fit(fitAnchors, options.model, options.maxGoals);

  // 6-8. Distribution, ranges, diagnostics, final validation.
  const preWarnings = stage1.normalizationWarnings.map((w) => `Normalization: ${w}`);
  const diagnostics = buildDiagnostics(
    options.model,
    fitted.fit,
    fitAnchors,
    [...preWarnings, ...consistencyWarnings, ...weightWarnings],
  );

  const result = buildProbabilityResult(fitted, anchors);

  // Merge fit-derived diagnostics (plus numerical defect warnings) into the
  // canonical result object.
  result.diagnostics = {
    ...diagnostics,
    warnings: [...diagnostics.warnings, ...result.diagnostics.warnings],
  };
  return result;
}
