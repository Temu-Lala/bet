"use client";

import type { useMatchAnalysis } from "@/hooks/use-match-analysis";

type MatchState = ReturnType<typeof useMatchAnalysis>;

/**
 * Shared parameter bar for the two-team screens (exact score, match
 * analysis): two scoring-rate inputs, matrix depth and an explicit
 * "derive from last fit" convenience action.
 */
export function MatchInputBar({ state }: { state: MatchState }) {
  const field =
    "tabular w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4">
      <label className="space-y-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-foreground/50">
          λ home team
        </span>
        <input
          value={state.homeText}
          onChange={(e) => state.setHomeText(e.target.value)}
          inputMode="decimal"
          className={field}
          aria-label="Home scoring rate"
        />
      </label>

      <label className="space-y-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-foreground/50">
          λ away team
        </span>
        <input
          value={state.awayText}
          onChange={(e) => state.setAwayText(e.target.value)}
          inputMode="decimal"
          className={field}
          aria-label="Away scoring rate"
        />
      </label>

      <label className="space-y-1">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-foreground/50">
          Score depth
        </span>
        <select
          value={state.maxGoals}
          onChange={(e) => state.setMaxGoals(Number.parseInt(e.target.value, 10))}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          aria-label="Maximum goals per team"
        >
          {[6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              0–{n}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={state.importFromLastAnalysis}
        disabled={!state.canImport}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        title={
          state.canImport
            ? "Split the last fitted expected total 55/45 home/away — an approximation, not a market reading"
            : "Run the analyzer first to make a fitted total available"
        }
      >
        Use last fitted total
      </button>

      <p className="max-w-xs text-xs leading-relaxed text-foreground/50">
        Rates are expected goals per match. Independence between the two sides is a modeling
        assumption of this screen.
      </p>
    </div>
  );
}
