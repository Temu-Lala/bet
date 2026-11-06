"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { MatchInputBar } from "@/components/analysis/MatchInputBar";
import { ExactScoreHeatmap } from "@/components/charts/ExactScoreHeatmap";
import { PercentageBadge } from "@/components/common/PercentageBadge";
import { ErrorMessage } from "@/components/common/States";
import { useMatchAnalysis } from "@/hooks/use-match-analysis";
import { formatPercentage } from "@/lib/utils/format-percentage";

export default function ExactScorePage() {
  const state = useMatchAnalysis();
  const result = state.result;

  return (
    <PageContainer>
      <PageHeader
        title="Exact Score"
        subtitle="Full scoreline matrix under the independent Poisson two-team model."
      />

      <div className="space-y-6">
        <MatchInputBar state={state} />

        {state.error && <ErrorMessage message={state.error} />}

        {result && (
          <>
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="mb-1 text-sm font-semibold">Score matrix</h3>
              <p className="mb-4 text-xs text-foreground/50">
                Rows are home goals, columns are away goals. Cell values are joint probabilities in %.
              </p>
              <ExactScoreHeatmap matrix={result.scoreMatrix} />
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold">Most probable scores</h3>
              <ol className="divide-y divide-border/60">
                {result.topScores.map((score, index) => (
                  <li key={`${score.home}-${score.away}`} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-xs text-foreground/40">{index + 1}.</span>
                    <span className="tabular w-16 font-semibold">
                      {score.home} - {score.away}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${(score.probability / result.topScores[0].probability) * 100}%`,
                        }}
                      />
                    </div>
                    <PercentageBadge probability={score.probability} />
                    <span className="tabular w-16 text-right text-xs text-foreground/50">
                      {score.probability > 0.0005
                        ? `fair ${Math.round(1 / score.probability * 100) / 100}`
                        : "—"}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-foreground/50">
                Listed high to low: 0-0, 1-0, 0-1, 1-1, 2-0, 2-1, 1-2 are typically the mass-heavy
                scores at ordinary scoring rates. Fair odds are 1 / P, before any margin.
              </p>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Home win", value: result.homeWin },
                { label: "Draw", value: result.draw },
                { label: "Away win", value: result.awayWin },
                { label: "Both teams score", value: result.bttsYes },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[11px] uppercase tracking-wide text-foreground/50">
                    {item.label}
                  </p>
                  <p className="tabular mt-1 text-xl font-semibold">
                    {formatPercentage(item.value)}
                  </p>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
