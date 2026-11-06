"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/States";
import { PercentageBadge } from "@/components/common/PercentageBadge";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { loadFromInput } from "@/stores/odds-store";
import { setAnalysisSuccess } from "@/stores/analysis-store";
import type { StoredCalculation } from "@/types/odds";

export default function HistoryPage() {
  const { items, loaded, remove, clear } = useCalculationHistory();
  const router = useRouter();

  const restore = (item: StoredCalculation) => {
    // Reopen exactly what was analyzed: odds back into the form, the stored
    // result back into session state — no recalculation, no re-derivation.
    loadFromInput(item.input);
    setAnalysisSuccess(item.result, item.input, item.options, []);
    router.push("/analyzer");
  };

  return (
    <PageContainer>
      <PageHeader
        title="History"
        subtitle="Every calculation is stored locally in this browser with its original odds, options and full result."
        actions={
          items.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete all saved analyses? This cannot be undone.")) clear();
              }}
              className="rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Clear history
            </button>
          ) : undefined
        }
      />

      {!loaded ? (
        <p className="text-sm text-foreground/50">Loading saved analyses…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="No saved analyses"
          description="Results appear here after you run the analyzer. Restoring reopens the original odds and the stored result without recalculating."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const dominant = item.result.goalRanges.reduce((best, r) =>
              r.probability > best.probability ? r : best,
            );
            return (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      {item.input.teamName || `Match · line ${item.input.markets[0]?.line ?? "—"}`}
                    </h3>
                    <p className="mt-0.5 text-xs text-foreground/50">
                      {new Date(item.createdAt).toLocaleString()}
                      {item.input.bookmaker ? ` · ${item.input.bookmaker}` : ""} ·{" "}
                      {item.options.model.replace("_", " ")} · margin{" "}
                      {item.options.marginMethod.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => restore(item)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-surface-muted hover:text-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <dl className="tabular mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-foreground/50">Expected goals</dt>
                    <dd className="font-semibold">{item.result.expectedGoals.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/50">λ</dt>
                    <dd className="font-semibold">{item.result.diagnostics.lambda.toFixed(3)}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/50">Fit error</dt>
                    <dd className="font-semibold">
                      {(item.result.diagnostics.fittingError * 100).toFixed(2)} pp
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/50">Top range</dt>
                    <dd>
                      <PercentageBadge probability={dominant.probability} />{" "}
                      <span className="text-foreground/60">{dominant.label}</span>
                    </dd>
                  </div>
                </dl>

                <p className="mt-2 text-xs text-foreground/40">
                  {item.input.markets.length} market
                  {item.input.markets.length === 1 ? "" : "s"} ·{" "}
                  {item.result.diagnostics.warnings.length === 0
                    ? "no warnings were raised"
                    : `${item.result.diagnostics.warnings.length} warning(s) at the time`}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="mt-6 text-xs leading-relaxed text-foreground/40">
          All stored data lives in this browser only — nothing is uploaded, and clearing
          browser storage removes the history permanently.
        </p>
      )}
    </PageContainer>
  );
}
