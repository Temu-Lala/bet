"use client";

import { useMemo, useState } from "react";
import {
  settleAsianPosition,
  settlementProbabilities,
  expectedValue,
} from "@/lib/probability/odds/asian-settlement";
import { parseAsianPosition } from "@/lib/validation/market.schema";
import type { ProbabilityResult } from "@/types/probability";
import { formatPercentage } from "@/lib/utils/format-percentage";

/**
 * Asian total settlement panel: takes a position (line/side/odds/stake),
 * settles it against every goal outcome of the fitted distribution and
 * reports the outcome probabilities plus expected value.
 * Settlement math is deliberately separate from distribution estimation.
 */
export function AsianTotalInput({ result }: { result: ProbabilityResult | null }) {
  const [line, setLine] = useState("5.0");
  const [side, setSide] = useState<"OVER" | "UNDER">("OVER");
  const [odds, setOdds] = useState("2.10");
  const [stake, setStake] = useState("100");

  const parsed = useMemo(
    () => parseAsianPosition({ line, side, odds, stake }),
    [line, side, odds, stake],
  );

  const analysis = useMemo(() => {
    if (!parsed.position || !result) return null;
    const probs = settlementProbabilities(
      parsed.position,
      result.exactGoals.map((g) => g.probability),
      result.tailProbability,
    );
    const ev = expectedValue(parsed.position, result.exactGoals.map((g) => g.probability));
    const sample = settleAsianPosition(
      Math.round(result.expectedGoals),
      parsed.position,
    );
    return { probs, ev, sample, expectedGoals: result.expectedGoals };
  }, [parsed, result]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniField label="Line" value={line} onChange={setLine} />
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground/50">
            Side
          </span>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as "OVER" | "UNDER")}
            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="OVER">Over</option>
            <option value="UNDER">Under</option>
          </select>
        </label>
        <MiniField label="Odds" value={odds} onChange={setOdds} />
        <MiniField label="Stake" value={stake} onChange={setStake} />
      </div>

      {parsed.error && <p className="text-xs text-danger">{parsed.error}</p>}

      {!result && !parsed.error && (
        <p className="text-xs text-foreground/50">
          Run a calculation first — settlement probabilities use the fitted goal distribution.
        </p>
      )}

      {analysis && !parsed.error && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3">
            {(
              [
                ["WIN", analysis.probs.WIN],
                ["HALF_WIN", analysis.probs.HALF_WIN],
                ["PUSH", analysis.probs.PUSH],
                ["HALF_LOSS", analysis.probs.HALF_LOSS],
                ["LOSS", analysis.probs.LOSS],
              ] as const
            ).map(
              ([name, p]) =>
                p > 0 && (
                  <div key={name} className="flex justify-between rounded-md bg-surface-muted px-2 py-1">
                    <span className="text-foreground/60">{name.replace("_", " ")}</span>
                    <span className="tabular font-medium">{formatPercentage(p)}</span>
                  </div>
                ),
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="text-foreground/60">
              EV at {Math.round(analysis.expectedGoals)} goals (round {analysis.sample.outcome.toLowerCase()})
            </span>
            <span
              className={`tabular font-semibold ${
                analysis.sample.profit >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {analysis.sample.profit >= 0 ? "+" : ""}
              {analysis.sample.profit.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="text-foreground/60">Distribution-weighted EV</span>
            <span
              className={`tabular font-semibold ${analysis.ev >= 0 ? "text-success" : "text-danger"}`}
            >
              {analysis.ev >= 0 ? "+" : ""}
              {analysis.ev.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-foreground/45">
            Push outcomes return the stake (zero net profit); quarter lines split the stake
            across two adjacent legs.
          </p>
        </div>
      )}
    </div>
  );
}

function MiniField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="tabular w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
