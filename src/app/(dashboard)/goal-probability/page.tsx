"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/States";
import { GoalRangeCards } from "@/components/probability/GoalRangeCards";
import { ExactGoalTable } from "@/components/probability/ExactGoalTable";
import { CumulativeProbability } from "@/components/probability/ProbabilityBreakdown";
import { GoalDistributionChart } from "@/components/charts/GoalDistributionChart";
import { LambdaIndicator } from "@/components/probability/LambdaIndicator";
import { useProbability } from "@/hooks/use-probability";

export default function GoalProbabilityPage() {
  const { result, input } = useProbability();

  if (!result) {
    return (
      <PageContainer>
        <PageHeader
          title="Goal Probability"
          subtitle="Range, exact-goal and cumulative probabilities for the last fitted team total."
        />
        <EmptyState
          title="No calculation in this session yet"
          description="Goal probabilities are derived from bookmaker odds. Run an analysis in the analyzer first — the result is kept in session state across navigation."
          action={
            <Link
              href="/analyzer"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Open analyzer
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Goal Probability"
        subtitle={`Model-estimated goal distribution for ${input?.teamName ?? "the analyzed team"}. All figures below are model output, not bookmaker prices.`}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <StatCard
          label="Expected goals"
          value={result.expectedGoals.toFixed(2)}
          sub={`λ = ${result.diagnostics.lambda.toFixed(3)} · ${result.diagnostics.model.replace("_", " ")}`}
          tone="accent"
        />
        <StatCard
          label="Most likely range"
          value={
            result.goalRanges.reduce((best, r) => (r.probability > best.probability ? r : best)).label
          }
          sub={`${(
            Math.max(...result.goalRanges.map((r) => r.probability)) * 100
          ).toFixed(2)}% probability`}
          tone="success"
        />
        <StatCard
          label="Retained tail"
          value={`${(result.tailProbability * 100).toFixed(3)}%`}
          sub={`beyond ${result.exactGoals.length - 1} goals — absorbed by the 6+ range`}
        />
      </div>

      <div className="mt-8 space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold">Goal ranges</h3>
          <GoalRangeCards ranges={result.goalRanges} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold">Distribution shape</h3>
          <GoalDistributionChart exactGoals={result.exactGoals} />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h3 className="mb-3 text-sm font-semibold">Exact goals</h3>
            <ExactGoalTable
              exactGoals={result.exactGoals}
              tailProbability={result.tailProbability}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">Cumulative under / over</h3>
            <CumulativeProbability result={result} />
            <LambdaIndicator diagnostics={result.diagnostics} />
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
