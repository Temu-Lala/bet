"use client";

import { useState } from "react";
import { GOAL_MARKET_ROWS } from "@/config/markets";
import { MarketGroup } from "./MarketGroup";
import { useOddsForm } from "@/hooks/use-odds-form";
import {
  addCustomLine,
  removeCustomLine,
  resetOdds,
  setOddsValue,
  persistDraft,
} from "@/stores/odds-store";
import type { OddsFormRow } from "@/lib/validation/odds.schema";

/**
 * The primary input screen component: team name, bookmaker, goal-line
 * market rows, custom lines, and actions (calculate / reset / sample).
 */
export function OddsForm({
  onCalculate,
  calculating,
}: {
  onCalculate: (rows: OddsFormRow[], teamName: string, bookmaker: string) => void;
  calculating: boolean;
}) {
  const { rows, teamName, bookmaker, setTeamName, setBookmaker, validation } =
    useOddsForm();
  const [customLine, setCustomLine] = useState("");
  const [customType, setCustomType] = useState<"STANDARD" | "ASIAN">("STANDARD");

  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning");

  const findRow = (line: number, marketType: "STANDARD" | "ASIAN") =>
    rows.find((r) => r.line === line && r.marketType === marketType);

  const loadSample = () => {
    const sample: OddsFormRow[] = [
      { line: 0.5, marketType: "STANDARD", under: "11.5", over: "1.05" },
      { line: 1.5, marketType: "STANDARD", under: "3.75", over: "1.28" },
      { line: 3.5, marketType: "STANDARD", under: "1.38", over: "3.25" },
      { line: 4.5, marketType: "STANDARD", under: "1.13", over: "" },
      { line: 5.0, marketType: "ASIAN", under: "", over: "11.5" },
    ];
    for (const row of sample) {
      if (row.under) setOddsValue(row.line, row.marketType, "under", row.under);
      if (row.over) setOddsValue(row.line, row.marketType, "over", row.over);
    }
    persistDraft();
  };

  const handleAddCustom = () => {
    const line = Number(customLine);
    if (!Number.isFinite(line) || line < 0) return;
    addCustomLine(Math.round(line * 4) / 4, customType);
    setCustomLine("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Team name (optional)">
          <input
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              persistDraft();
            }}
            placeholder="e.g. Home side total goals"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </Field>
        <Field label="Bookmaker (optional)">
          <input
            value={bookmaker}
            onChange={(e) => {
              setBookmaker(e.target.value);
              persistDraft();
            }}
            placeholder="e.g. Pinnacle"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </Field>
      </div>

      <div className="space-y-2">
        {GOAL_MARKET_ROWS.map((config) => (
          <MarketGroup
            key={`${config.marketType}:${config.line}`}
            config={config}
            row={findRow(config.line, config.marketType)}
            onChange={(side, value) => {
              setOddsValue(config.line, config.marketType, side, value);
              persistDraft();
            }}
          />
        ))}

        {rows
          .filter((r) => !GOAL_MARKET_ROWS.some((c) => c.line === r.line && c.marketType === r.marketType))
          .map((row) => (
            <MarketGroup
              key={`${row.marketType}:${row.line}`}
              config={{
                line: row.line,
                underLabel: `Under ${row.line}`,
                overLabel: `Over ${row.line}`,
                marketType: row.marketType,
                hint: "Custom line",
              }}
              row={row}
              onChange={(side, value) => {
                setOddsValue(row.line, row.marketType, side, value);
                persistDraft();
              }}
              onRemove={() => removeCustomLine(row.line, row.marketType)}
            />
          ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field label="Custom goal line">
          <input
            value={customLine}
            onChange={(e) => setCustomLine(e.target.value)}
            placeholder="e.g. 2.25"
            inputMode="decimal"
            className="tabular w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </Field>
        <Field label="Type">
          <select
            value={customType}
            onChange={(e) => setCustomType(e.target.value as "STANDARD" | "ASIAN")}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="STANDARD">Standard (.5)</option>
            <option value="ASIAN">Asian (.0/.25/.75)</option>
          </select>
        </Field>
        <button
          onClick={handleAddCustom}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          Add line
        </button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {errors.map((e, i) => (
            <p key={i}>
              {e.field}: {e.message}
            </p>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          {warnings.map((e, i) => (
            <p key={i}>
              {e.field}: {e.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => {
            onCalculate(rows, teamName, bookmaker);
            persistDraft();
          }}
          disabled={calculating || !validation.valid}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Calculate probabilities
        </button>
        <button
          onClick={loadSample}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
        >
          Load example odds
        </button>
        <button
          onClick={() => {
            resetOdds();
          }}
          className="rounded-lg px-4 py-2.5 text-sm text-foreground/60 hover:bg-surface-muted hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </span>
      {children}
    </label>
  );
}
