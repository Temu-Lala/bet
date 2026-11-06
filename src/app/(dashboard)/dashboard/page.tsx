"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/States";
import { GoalRangeCards } from "@/components/probability/GoalRangeCards";
import { useProbability } from "@/hooks/use-probability";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { formatPercentage } from "@/lib/utils/format-percentage";

export default function DashboardPage() {
  const { result, status } = useProbability();
  const { items, loaded } = useCalculationHistory();

  const averageXg =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.result.expectedGoals, 0) / items.length
      : null;

  const rangeCounts = new Map<string, number>();
  for (const item of items) {
    const dominant = item.result.goalRanges.reduce((best, r) =>
      r.probability > best.probability ? r : best,
    );
    rangeCounts.set(dominant.label, (rangeCounts.get(dominant.label) ?? 0) + 1);
  }
  const topRange = [...rangeCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of the analysis workspace. All calculations run locally against the independent probability engine."
        actions={
          <Link
            href="/analyzer"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            New analysis
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total analyses"
          value={loaded ? String(items.length) : "…"}
          sub="stored in browser history"
        />
        <StatCard
          label="Average expected goals"
          value={averageXg === null ? "—" : averageXg.toFixed(2)}
          sub="across saved analyses"
        />
        <StatCard
          label="Most frequent range"
          value={topRange ? topRange[0] : "—"}
          sub={topRange ? `${topRange[1]} of ${items.length} analyses` : "no history yet"}
          tone="accent"
        />
        <StatCard
          label="Last session status"
          value={status === "done" ? "Completed" : status === "error" ? "Input blocked" : "Idle"}
          sub={result ? `${result.diagnostics.model.replace("_", " ")} · λ ${result.diagnostics.lambda.toFixed(3)}` : "run the analyzer to populate"}
          tone={status === "done" ? "success" : "default"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 text-sm font-semibold">Latest analysis</h3>
          {result ? (
            <GoalRangeCards ranges={result.goalRanges} />
          ) : (
            <EmptyState
              title="No results in this session"
              description="Enter bookmaker odds in the analyzer. Results from your last calculation appear here."
              action={
                <Link
                  href="/analyzer"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                >
                  Open analyzer
                </Link>
              }
            />
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Recent analyses</h3>
          {items.length === 0 ? (
            <EmptyState
              title="History is empty"
              description="Every calculation is saved locally with its original odds, model choice and result."
            />
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              {items.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href="/history"
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-muted"
                >
                  <div>
                    <p className="font-medium">
                      {item.input.teamName ?? `Match @ ${item.input.bookmaker ?? "bookmaker"}`}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="tabular text-right">
                    <p className="font-semibold">{item.result.expectedGoals.toFixed(2)} xG</p>
                    <p className="text-xs text-foreground/50">
                      top range {formatPercentage(
                        Math.max(...item.result.goalRanges.map((r) => r.probability)),
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
