"use client";

import type { GoalProbability } from "@/types/probability";
import { useStoreSelector } from "@/lib/utils/store";
import { settingsStore } from "@/stores/settings-store";
import { formatPercentage } from "@/lib/utils/format-percentage";

/** Exact 0..N goal probability table with the tail row kept visible. */
export function ExactGoalTable({
  exactGoals,
  tailProbability,
}: {
  exactGoals: GoalProbability[];
  tailProbability: number;
}) {
  const precision = useStoreSelector(settingsStore, (s) => s.precision);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-left text-[11px] uppercase tracking-wider text-foreground/50">
            <th className="px-4 py-2 font-medium">Goals</th>
            <th className="px-4 py-2 text-right font-medium">Probability</th>
            <th className="px-4 py-2 text-right font-medium">Fair odds</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {exactGoals.map(({ goals, probability }) => (
            <tr key={goals} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-1.5">{goals}</td>
              <td className="px-4 py-1.5 text-right">{formatPercentage(probability, precision)}</td>
              <td className="px-4 py-1.5 text-right text-foreground/55">
                {probability > 0.0005 ? (1 / probability).toFixed(2) : "—"}
              </td>
            </tr>
          ))}
          <tr className="bg-surface-muted/60 text-foreground/60">
            <td className="px-4 py-1.5">
              {exactGoals.length}+
            </td>
            <td className="px-4 py-1.5 text-right">
              {formatPercentage(tailProbability, precision)}
            </td>
            <td className="px-4 py-1.5 text-right">tail (retained)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
