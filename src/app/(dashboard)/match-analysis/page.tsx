"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { MatchInputBar } from "@/components/analysis/MatchInputBar";
import { GoalDistributionChart } from "@/components/charts/GoalDistributionChart";
import { PercentageBadge } from "@/components/common/PercentageBadge";
import { ErrorMessage } from "@/components/common/States";
import { useMatchAnalysis } from "@/hooks/use-match-analysis";
import { formatPercentage } from "@/lib/utils/format-percentage";

export default function MatchAnalysisPage() {
  const state = useMatchAnalysis();
  const result = state.result;

  const overUnderLines = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

  return (
    <PageContainer>
      <PageHeader
        title="Match Analysis"
        subtitle="Combined two-team view: outcome split, BTTS, total-goals distribution and per-side marginals."
      />

      <div className="space-y-6">
        <MatchInputBar state={state} />

        {state.error && <ErrorMessage message={state.error} />}

        {result && (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <StatCard
                label="Expected total"
                value={(result.homeLambda + result.awayLambda).toFixed(2)}
                sub={`λ home ${result.homeLambda.toFixed(2)} · λ away ${result.awayLambda.toFixed(2)}`}
                tone="accent"
              />
              <StatCard
                label="Home win"
                value={formatPercentage(result.homeWin)}
                sub={`draw ${formatPercentage(result.draw)}`}
              />
              <StatCard
                label="Away win"
                value={formatPercentage(result.awayWin)}
                sub={`1X2 sums to ${formatPercentage(result.homeWin + result.draw + result.awayWin, 1)}`}
              />
              <StatCard
                label="Both teams score"
                value={formatPercentage(result.bttsYes)}
                sub={`BTTS no ${formatPercentage(result.bttsNo)}`}
                tone="success"
              />
            </div>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="mb-1 text-sm font-semibold">Total match goals</h3>
              <p className="mb-4 text-xs text-foreground/50">
                Sum of two independent Poisson rates is exactly Poisson(λ home + λ away).
              </p>
              <GoalDistributionChart exactGoals={result.totalGoals} />
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Over / under the standard lines</h3>
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-muted text-left text-[11px] uppercase tracking-wider text-foreground/50">
                        <th className="px-4 py-2 font-medium">Line</th>
                        <th className="px-4 py-2 text-right font-medium">Under</th>
                        <th className="px-4 py-2 text-right font-medium">Over</th>
                      </tr>
                    </thead>
                    <tbody className="tabular">
                      {overUnderLines.map((line) => {
                        const under =
                          result.totalCumulative[`P(total<=${Math.floor(line)})`] ?? 1;
                        return (
                          <tr key={line} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-1.5">{line.toFixed(1)}</td>
                            <td className="px-4 py-1.5 text-right">
                              <PercentageBadge probability={under} />
                            </td>
                            <td className="px-4 py-1.5 text-right">
                              <PercentageBadge probability={1 - under} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs leading-relaxed text-foreground/50">
                  Model probabilities from the fitted rates — compare against the bookmaker price,
                  never present them as market prices.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Per-side goal marginals</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MarginalList label="Home team" goals={result.homeMarginal} />
                  <MarginalList label="Away team" goals={result.awayMarginal} />
                </div>
                <p className="text-xs leading-relaxed text-foreground/50">
                  Single-team distributions implied by the two rates. Mass above the chosen score
                  depth is not shown here; it is retained by the total-goals distribution above.
                </p>
              </section>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}

function MarginalList({
  label,
  goals,
}: {
  label: string;
  goals: { goals: number; probability: number }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <p className="border-b border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground/60">
        {label}
      </p>
      <ul className="divide-y divide-border/50">
        {goals.map(({ goals: k, probability }) => (
          <li key={k} className="flex items-center justify-between px-3 py-1 text-sm">
            <span className="text-foreground/70">{k} goal{k === 1 ? "" : "s"}</span>
            <span className="tabular font-medium">{formatPercentage(probability)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
