"use client";

import type { ProbabilityResult } from "@/types/probability";
import { poissonCdf } from "@/lib/probability/core/poisson-cdf";
import { formatPercentage } from "@/lib/utils/format-percentage";
import { cn } from "@/lib/utils/cn";

/**
 * Market vs model breakdown: for every anchor line, what the bookmaker
 * prices indicate after margin removal next to what the fitted model says.
 * The two measurements stay visually separate — they are not interchangeable.
 */
export function ProbabilityBreakdown({ result }: { result: ProbabilityResult }) {
  const { marketBoundaries, diagnostics } = result;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left text-[11px] uppercase tracking-wider text-foreground/50">
            <th className="px-4 py-2 font-medium">Market</th>
            <th className="px-4 py-2 font-medium">Boundary</th>
            <th className="px-4 py-2 text-right font-medium">Wt</th>
            <th className="px-4 py-2 text-right font-medium">Market</th>
            <th className="px-4 py-2 text-right font-medium">Model</th>
            <th className="px-4 py-2 text-right font-medium">Diff</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {marketBoundaries.map((anchor) => {
            const modelProb = poissonCdf(anchor.k, diagnostics.lambda);
            const diff = modelProb - anchor.probability;
            return (
              <tr
                key={`${anchor.line}`}
                className={`border-b border-border/50 last:border-0 ${
                  anchor.weight === 0 ? "text-foreground/40" : ""
                }`}
              >
                <td className="px-4 py-1.5">
                  {anchor.line.toFixed(1)}
                  {!anchor.complete && (
                    <span className="ml-2 rounded bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
                      one-sided
                    </span>
                  )}
                  {anchor.weight === 0 && (
                    <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-foreground/50">
                      excluded from fit
                    </span>
                  )}
                </td>
                <td className="px-4 py-1.5 text-foreground/55">P(X ≤ {anchor.k})</td>
                <td className="px-4 py-1.5 text-right text-foreground/55">
                  {anchor.weight.toFixed(2)}
                </td>
                <td className="px-4 py-1.5 text-right">{formatPercentage(anchor.probability)}</td>
                <td className="px-4 py-1.5 text-right">{formatPercentage(modelProb)}</td>
                <td
                  className={cn(
                    "px-4 py-1.5 text-right",
                    Math.abs(diff) > 0.05 ? "text-danger" : Math.abs(diff) > 0.02 ? "text-warning" : "text-foreground/60",
                  )}
                >
                  {diff >= 0 ? "+" : ""}
                  {(diff * 100).toFixed(1)} pp
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Under/Over model probabilities for the standard .5 lines. */
export function CumulativeProbability({ result }: { result: ProbabilityResult }) {
  const lines = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {lines.map((line) => {
        const k = Math.floor(line);
        const under = result.cumulativeProbabilities[`P(X<=${k})`] ?? 1;
        return (
          <div key={line} className="rounded-lg border border-border bg-surface px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-foreground/50">
              Line {line.toFixed(1)}
            </p>
            <div className="mt-1 flex justify-between text-xs">
              <span>
                Under{" "}
                <span className="tabular font-semibold">{formatPercentage(under)}</span>
              </span>
              <span>
                Over{" "}
                <span className="tabular font-semibold">{formatPercentage(1 - under)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
