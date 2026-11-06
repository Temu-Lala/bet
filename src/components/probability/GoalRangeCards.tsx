"use client";

import type { GoalRangeProbability } from "@/types/probability";
import { useStoreSelector } from "@/lib/utils/store";
import { settingsStore } from "@/stores/settings-store";
import { formatPercentage } from "@/lib/utils/format-percentage";
import { cn } from "@/lib/utils/cn";

/** The four headline range cards: 0-1 / 2-3 / 4-5 / 6+. */
export function GoalRangeCards({ ranges }: { ranges: GoalRangeProbability[] }) {
  const precision = useStoreSelector(settingsStore, (s) => s.precision);
  const max = Math.max(...ranges.map((r) => r.probability), 0.001);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ranges.map((range) => (
        <div
          key={range.label}
          className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/50">
            {range.label} goals
          </p>
          <p className="tabular mt-2 text-2xl font-semibold tracking-tight">
            {formatPercentage(range.probability, precision)}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                range.probability === max ? "bg-accent" : "bg-accent/40",
              )}
              style={{ width: `${(range.probability / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
