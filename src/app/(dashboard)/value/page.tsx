"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/States";
import { Icon } from "@/components/common/Icon";
import { useBettingAnalysis } from "@/hooks/use-betting-analysis";
import { useProbability } from "@/hooks/use-probability";
import { LOW_AGREEMENT_FIT_ERROR } from "@/lib/probability";
import type { MarketAssessment } from "@/types/market";

const pct = (v: number, d: number) => `${(v * 100).toFixed(d)}%`;
const signedPct = (v: number, d: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(d)}%`;

function SourceBadge({ assessment }: { assessment: MarketAssessment }) {
  const same = assessment.probabilitySource === "SAME_MARKET_FIT";
  return (
    <span
      title={
        same
          ? "The fitted lambda used this market's price - EV here measures consistency, not independent edge."
          : "This market did not contribute to the fit (excluded by weight or absent from the anchors)."
      }
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        same ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {same ? "same-market fit" : "outside fit"}
    </span>
  );
}

export default function ValuePage() {
  const { analysis, staking, precision } = useBettingAnalysis();
  const { result } = useProbability();

  if (!analysis || !result) {
    return (
      <PageContainer>
        <PageHeader
          title="Value & Risk"
          subtitle="Expected value against offered prices, model-vs-market comparison and guarded Kelly staking."
        />
        <EmptyState
          title="No calculation in this session yet"
          description="Value assessments are computed from the fitted distribution and the odds you provided. Run an analysis in the analyzer first."
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

  const lowAgreement = result.diagnostics.fittingError > LOW_AGREEMENT_FIT_ERROR;
  const positiveCount = analysis.assessments.filter((a) => a.classification === "POSITIVE_EV").length;
  // Market-specific notes worth surfacing once; the same-market caveat is
  // already covered by the badge and the banner, NO_VALUE by the table itself.
  const stakeWarnings = Array.from(
    new Set(
      analysis.assessments.flatMap((a) =>
        a.warnings.filter((w) => w.startsWith("Fractional Kelly") || w.startsWith("Model/market agreement")),
      ),
    ),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Value & Risk"
        subtitle="Never confuse a high-probability outcome with a valuable betting opportunity. Everything below is a model-consistency check, not a validated edge."
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <StatCard
          label="Market-model agreement"
          value={result.diagnostics.fittingError.toFixed(4)}
          sub={
            lowAgreement
              ? `above ${LOW_AGREEMENT_FIT_ERROR} threshold - stakes suppressed`
              : `within ${LOW_AGREEMENT_FIT_ERROR} threshold`
          }
          tone={lowAgreement ? "warning" : "success"}
        />
        <StatCard
          label="Quoted sides evaluated"
          value={`${analysis.assessments.length}`}
          sub={`${positiveCount} with positive EV - retained with source labels`}
          tone="accent"
        />
        <StatCard
          label="Staking frame"
          value={`${pct(staking.kellyMultiplier, 0)} Kelly`}
          sub={`bankroll ${staking.bankroll} · cap ${pct(staking.maxStakeFraction, 1)}/bet`}
        />
      </div>

      <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <span className="mt-0.5 text-amber-500">
            <Icon name="value" className="h-4 w-4" />
          </span>
          <p className="text-xs leading-relaxed text-foreground/70">
            <span className="font-semibold text-foreground">Read this before acting on any number below. </span>
            The model probability was fitted from these same bookmaker prices unless labelled
            <span className="font-medium"> outside fit</span>, so a positive EV measures agreement between the model and
            one price set - it is <span className="font-medium">not independent evidence of edge</span>. Proportional margin
            removal is a convention, not the bookmaker&apos;s true probabilities. Establishing real predictive value
            requires calibration against historical outcomes (backtesting, planned post-v1). Kelly fractions assume the
            probability is well calibrated; when the fit disagrees with the prices, stakes are automatically suppressed.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold">EV &amp; Kelly against offered prices</h3>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-2.5 text-left font-medium">Market</th>
                <th className="px-4 py-2.5 text-right font-medium">Odds</th>
                <th className="px-4 py-2.5 text-right font-medium">Mkt P (raw)</th>
                <th className="px-4 py-2.5 text-right font-medium">Mkt P (no margin)</th>
                <th className="px-4 py-2.5 text-right font-medium">Model P</th>
                <th className="px-4 py-2.5 text-right font-medium">EV / unit</th>
                <th className="px-4 py-2.5 text-right font-medium">Full Kelly</th>
                <th className="px-4 py-2.5 text-right font-medium">Stake</th>
                <th className="px-4 py-2.5 text-left font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {analysis.assessments.map((a) => (
                <tr
                  key={`${a.market}-${a.side}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{a.market}</div>
                    <div className="text-[11px] text-foreground/50">
                      {a.marketType === "ASIAN" ? "Asian line - push/half settlement applied" : "standard line"}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.bookmakerOdds.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{pct(a.marketImpliedRaw, precision)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {a.marketImpliedRemoved === null ? (
                      <span className="text-foreground/40">one side only</span>
                    ) : (
                      pct(a.marketImpliedRemoved, precision)
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{pct(a.modelProbability, precision)}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono ${
                      a.expectedValuePerUnit > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {signedPct(a.expectedValuePerUnit, precision)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {a.classification === "POSITIVE_EV" ? pct(a.fullKellyFraction, 1) : "0.0%"}
                    {a.classification === "POSITIVE_EV" && a.recommendedStake === 0 && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400">suppressed</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {a.recommendedStake > 0 ? a.recommendedStake.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <SourceBadge assessment={a} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-foreground/50">
          EV per unit and Kelly use the exact settlement factors (win b, half-win b/2, push 0, half-loss -1/2,
          loss -1) over the full fitted distribution including the retained tail - not the binary p&#215;O&#8722;1
          shortcut. Full Kelly is the log-growth maximizer, then scaled by {pct(staking.kellyMultiplier, 0)} and
          capped at {pct(staking.maxStakeFraction, 1)} of bankroll. NO_VALUE rows are kept, never discarded.
        </p>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold">Model vs market - goal ranges</h3>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-2.5 text-left font-medium">Range</th>
                <th className="px-4 py-2.5 text-right font-medium">Model P</th>
                <th className="px-4 py-2.5 text-right font-medium">Market P</th>
                <th className="px-4 py-2.5 text-right font-medium">Fair odds (model)</th>
                <th className="px-4 py-2.5 text-right font-medium">Fair odds (market)</th>
                <th className="px-4 py-2.5 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rangeComparisons.map((r) => (
                <tr key={r.label} className="border-b border-border/60 last:border-0 align-top">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{r.label} goals</div>
                    {r.marketProbability === null && (
                      <div className="mt-0.5 max-w-md text-[11px] leading-relaxed text-foreground/45">
                        {r.notes.find((n) => n.startsWith("Market estimate not derivable")) ??
                          "Market side needs complete both-sides .5 anchors bracketing this range."}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{pct(r.modelProbability, precision)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.marketProbability === null ? (
                      <span className="text-foreground/40">not derivable</span>
                    ) : (
                      pct(r.marketProbability, precision)
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.fairOddsModel === null ? "—" : r.fairOddsModel.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.fairOddsMarket === null ? "—" : r.fairOddsMarket.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {r.difference === null ? (
                      "—"
                    ) : (
                      <span className={r.difference > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {signedPct(r.difference, precision)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-foreground/50">
          The market column is only filled where complete (both-sides) standard .5 markets bracket the range,
          after margin removal. Where they don&apos;t exist, no market number is shown - the model estimate is
          a Poisson result, never a fabricated market subtraction. Disagreement alone is not value.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Derivative markets - model only</h3>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground/50">
                  <th className="px-4 py-2.5 text-left font-medium">Market</th>
                  <th className="px-4 py-2.5 text-left font-medium">From</th>
                  <th className="px-4 py-2.5 text-right font-medium">Model P</th>
                  <th className="px-4 py-2.5 text-right font-medium">Fair odds</th>
                </tr>
              </thead>
              <tbody>
                {analysis.derivatives.map((d) => (
                  <tr key={d.label} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{d.label}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground/50">{d.formula}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{pct(d.probability, precision)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{d.fairOdds === null ? "—" : d.fairOdds.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Assessment warnings</h3>
          <ul className="space-y-2">
            {analysis.warnings.map((w, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-foreground/70"
              >
                {w}
              </li>
            ))}
            {stakeWarnings.map((w) => (
              <li
                key={w}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-foreground/70"
              >
                {w}
              </li>
            ))}
          </ul>
          <p className="text-[11px] leading-relaxed text-foreground/50">
            The fitted lambda describes the analyzed team&apos;s total goals - which is exactly what these goal
            markets price. Team-vs-opponent markets (clean sheet vs an opponent&apos;s attack) would need the
            two-team model from the Match Analysis screen; they are not derivable from a single lambda and no
            such numbers are shown here.
          </p>
        </div>
      </section>
    </PageContainer>
  );
}
