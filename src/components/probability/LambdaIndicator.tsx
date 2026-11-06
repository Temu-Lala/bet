"use client";

import type { ModelDiagnostics } from "@/types/probability";
import { Icon } from "@/components/common/Icon";
import { cn } from "@/lib/utils/cn";

/**
 * Model diagnostics strip: fitted lambda, fitting error and honest warnings.
 * The model never claims a perfect market recovery it did not achieve.
 */
export function LambdaIndicator({ diagnostics }: { diagnostics: ModelDiagnostics }) {
  const errorLevel =
    diagnostics.fittingError <= 0.02
      ? "good"
      : diagnostics.fittingError <= 0.06
        ? "fair"
        : "poor";

  const errorColor = {
    good: "text-success",
    fair: "text-warning",
    poor: "text-danger",
  }[errorLevel];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground/50">Model</p>
          <p className="text-sm font-semibold">{diagnostics.model.replace("_", " ")}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground/50">λ (scoring rate)</p>
          <p className="tabular text-sm font-semibold">{diagnostics.lambda.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground/50">Fitting error</p>
          <p className={cn("tabular text-sm font-semibold", errorColor)}>
            {(diagnostics.fittingError * 100).toFixed(2)} pp
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground/50">Markets used</p>
          <p className="tabular text-sm font-semibold">{diagnostics.marketCount}</p>
        </div>
      </div>

      {diagnostics.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {diagnostics.warnings.map((warning, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground/60">
              <span className="mt-0.5 shrink-0 text-warning">
                <Icon name="warning" className="h-3.5 w-3.5" />
              </span>
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
