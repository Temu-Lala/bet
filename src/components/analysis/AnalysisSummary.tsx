"use client";

import type { ProbabilityResult } from "@/types/probability";
import { FIT_ERROR_THRESHOLDS } from "@/lib/probability/fitting/model-diagnostics";
import { formatPercentage } from "@/lib/utils/format-percentage";

/**
 * Plain-language analysis summary: which range dominates, how strongly the
 * markets agree with the fitted model, and how many markets were usable.
 */
export function AnalysisSummary({ result }: { result: ProbabilityResult }) {
  const dominant = result.goalRanges.reduce((best, r) =>
    r.probability > best.probability ? r : best,
  );
  const { diagnostics } = result;

  const confidence =
    diagnostics.fittingError <= FIT_ERROR_THRESHOLDS.good
      ? "high"
      : diagnostics.fittingError <= FIT_ERROR_THRESHOLDS.concerning
        ? "moderate"
        : "low";

  const confidenceTone = {
    high: "bg-success/10 text-success",
    moderate: "bg-warning/10 text-warning",
    low: "bg-danger/10 text-danger",
  }[confidence];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${confidenceTone}`}>
          {confidence} market-model agreement
        </span>
        <span className="text-xs text-foreground/50">
          {diagnostics.marketCount} boundary{diagnostics.marketCount === 1 ? "" : "s"} ·{" "}
          {diagnostics.model.replace("_", " ")}
        </span>
      </div>
      <p className="mt-3 leading-relaxed text-foreground/80">
        The fitted {diagnostics.model.toLowerCase().replace("_", " ")} model estimates{" "}
        <strong className="tabular">{result.expectedGoals.toFixed(2)}</strong> expected goals
        with a scoring rate λ = <strong className="tabular">{diagnostics.lambda.toFixed(3)}</strong>.
        The most likely outcome band is <strong>{dominant.label} goals</strong> at{" "}
        <strong className="tabular">{formatPercentage(dominant.probability)}</strong>.{" "}
        {confidence === "high"
          ? "Bookmaker prices and the model agree closely; the distribution can be treated as a faithful reading of the market."
          : confidence === "moderate"
            ? "Prices and model show moderate disagreement — treat range estimates as indicative, and review the breakdown table."
            : "Prices and model disagree materially; at least one market is inconsistent with the others or with any Poisson-type distribution. Review the warnings before relying on these numbers."}
      </p>
    </div>
  );
}

export function ConfidenceIndicator({ fittingError }: { fittingError: number }) {
  const pct = Math.min(1, fittingError / (FIT_ERROR_THRESHOLDS.concerning * 2));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-foreground/50">
        <span>agreement</span>
        <span className="tabular">{(fittingError * 100).toFixed(2)} pp RMSE</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${
            fittingError <= FIT_ERROR_THRESHOLDS.good
              ? "bg-success"
              : fittingError <= FIT_ERROR_THRESHOLDS.concerning
                ? "bg-warning"
                : "bg-danger"
          }`}
          style={{ width: `${(1 - pct) * 100}%` }}
        />
      </div>
    </div>
  );
}
