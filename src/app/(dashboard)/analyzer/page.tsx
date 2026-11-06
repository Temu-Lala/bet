"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { OddsForm } from "@/components/odds/OddsForm";
import { OddsSummary } from "@/components/odds/OddsSummary";
import { AsianTotalInput } from "@/components/odds/AsianTotalInput";
import { GoalRangeCards } from "@/components/probability/GoalRangeCards";
import { LambdaIndicator } from "@/components/probability/LambdaIndicator";
import { ProbabilityBreakdown } from "@/components/probability/ProbabilityBreakdown";
import { GoalDistributionChart } from "@/components/charts/GoalDistributionChart";
import { AnalysisSummary } from "@/components/analysis/AnalysisSummary";
import { ErrorMessage, LoadingState } from "@/components/common/States";
import { useCalculation } from "@/hooks/use-calculation";
import { useOddsForm } from "@/hooks/use-odds-form";
import { restoreDraft } from "@/stores/odds-store";
import { StatCard } from "@/components/common/StatCard";

export default function AnalyzerPage() {
  const { status, result, error, issues, calculate } = useCalculation();
  const { markets } = useOddsForm();

  useEffect(() => {
    restoreDraft();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Odds Analyzer"
        subtitle="Enter bookmaker Over/Under prices for one side's total goals. Every market is independently optional."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <section className="rounded-2xl border border-border bg-surface/60 p-5">
            <OddsForm onCalculate={calculate} calculating={status === "calculating"} />
          </section>

          {error && (
            <ErrorMessage
              message={error}
              details={issues.filter((i) => i.severity === "error").map((i) => i.message)}
            />
          )}
          {status === "calculating" && <LoadingState />}
        </div>

        <div className="space-y-4 xl:col-span-2">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold">Market-implied probabilities</h3>
            <p className="mb-3 mt-0.5 text-xs text-foreground/50">
              Raw bookmaker view after margin removal — kept separate from model output.
            </p>
            <OddsSummary markets={markets} />
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold">Asian total settlement</h3>
            <p className="mb-3 mt-0.5 text-xs text-foreground/50">
              Settle a position against the fitted distribution (supports .0/.25/.5 lines).
            </p>
            <AsianTotalInput result={result} />
          </section>
        </div>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <StatCard
              label="Expected goals"
              value={result.expectedGoals.toFixed(2)}
              sub={`fitted scoring rate λ = ${result.diagnostics.lambda.toFixed(3)}`}
              tone="accent"
            />
            <StatCard
              label="Distribution mass"
              value={`${(result.totalProbability * 100).toFixed(4)}%`}
              sub={`tail beyond ${result.exactGoals.length - 1}+ retained: ${(result.tailProbability * 100).toFixed(3)}%`}
              tone="success"
            />
            <StatCard
              label="Model agreement"
              value={`${(result.diagnostics.fittingError * 100).toFixed(2)} pp`}
              sub="weighted RMSE between markets and model"
              tone={result.diagnostics.fittingError <= 0.02 ? "success" : "warning"}
            />
          </div>

          <GoalRangeCards ranges={result.goalRanges} />

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold">Goal distribution (model-estimated)</h3>
            <GoalDistributionChart exactGoals={result.exactGoals} />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Market vs model</h3>
              <ProbabilityBreakdown result={result} />
            </section>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Diagnostics</h3>
              <LambdaIndicator diagnostics={result.diagnostics} />
              <AnalysisSummary result={result} />
              <p className="px-1 text-xs leading-relaxed text-foreground/45">
                Interpretation: λ is the scoring rate <em>implied by the selected markets under this
                model&apos;s assumptions</em>, not a measured team attribute — and proportional
                margin removal is a convention, not the bookmaker&apos;s true probabilities. A close
                fit shows consistency with prices, not predictive accuracy; establishing that
                requires historical backtesting (planned, post-v1).
              </p>
            </section>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
