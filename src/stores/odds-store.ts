"use client";

import { createStore } from "@/lib/utils/store";
import type { OddsFormRow } from "@/lib/validation/odds.schema";
import type { MarketOdds, OddsInput } from "@/types/probability";
import { GOAL_MARKET_ROWS } from "@/config/markets";
import { STORAGE_KEYS } from "@/lib/utils/constants";

/**
 * Odds store: keeps entered odds, team/bookmaker selection and the custom
 * lines. It stores user input only — never calculation results, and never
 * performs math (that belongs to the engine).
 */

export interface OddsState {
  teamName: string;
  bookmaker: string;
  rows: OddsFormRow[];
  customLines: OddsFormRow[];
}

function initialRows(): OddsFormRow[] {
  return GOAL_MARKET_ROWS.map((row) => ({
    line: row.line,
    marketType: row.marketType,
    under: "",
    over: "",
  }));
}

export const oddsStore = createStore<OddsState>({
  teamName: "",
  bookmaker: "",
  rows: initialRows(),
  customLines: [],
});

export function setTeamName(teamName: string): void {
  oddsStore.set({ teamName });
}

export function setBookmaker(bookmaker: string): void {
  oddsStore.set({ bookmaker });
}

export function setOddsValue(line: number, marketType: "STANDARD" | "ASIAN", side: "under" | "over", value: string): void {
  const update = (list: OddsFormRow[]) =>
    list.map((row) =>
      row.line === line && row.marketType === marketType
        ? { ...row, [side]: value }
        : row,
    );

  const state = oddsStore.get();
  const inCustom = state.customLines.some((r) => r.line === line && r.marketType === marketType);
  if (inCustom) {
    oddsStore.set({ customLines: update(state.customLines) });
  } else {
    oddsStore.set({ rows: update(state.rows) });
  }
}

export function addCustomLine(line: number, marketType: "STANDARD" | "ASIAN"): void {
  const state = oddsStore.get();
  const exists = [...state.rows, ...state.customLines].some(
    (r) => r.line === line && r.marketType === marketType,
  );
  if (exists) return;
  oddsStore.set({
    customLines: [...state.customLines, { line, marketType, under: "", over: "" }],
  });
}

export function removeCustomLine(line: number, marketType: "STANDARD" | "ASIAN"): void {
  const state = oddsStore.get();
  oddsStore.set({
    customLines: state.customLines.filter(
      (r) => !(r.line === line && r.marketType === marketType),
    ),
  });
}

export function resetOdds(): void {
  oddsStore.set({ teamName: "", bookmaker: "", rows: initialRows(), customLines: [] });
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEYS.draftOdds);
  }
}

export function allRows(): OddsFormRow[] {
  const state = oddsStore.get();
  return [...state.rows, ...state.customLines];
}

/**
 * Reload a saved analysis' odds into the form (history restore). Markets
 * matching the standard scaffold fill their rows; anything else becomes a
 * custom line. Numeric odds are converted back to display strings as-is —
 * no re-interpretation of the user's original input.
 */
export function loadFromInput(input: OddsInput): void {
  const toText = (value: number | null): string => (value === null ? "" : String(value));
  const standardKey = new Set(GOAL_MARKET_ROWS.map((r) => `${r.line}|${r.marketType}`));

  const restored: OddsFormRow[] = input.markets.map((m: MarketOdds) => ({
    line: m.line,
    marketType: m.marketType,
    under: toText(m.under),
    over: toText(m.over),
  }));

  const rows = initialRows().map((base) => {
    const match = restored.find(
      (r) => r.line === base.line && r.marketType === base.marketType,
    );
    return match ? { ...base, under: match.under, over: match.over } : base;
  });

  const customLines = restored.filter(
    (r) => !standardKey.has(`${r.line}|${r.marketType}`),
  );

  oddsStore.set({
    teamName: input.teamName ?? "",
    bookmaker: input.bookmaker ?? "",
    rows,
    customLines,
  });
  persistDraft();
}

/** Draft persistence so a page navigation does not lose entered odds. */
export function persistDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.draftOdds, JSON.stringify(oddsStore.get()));
  } catch {
    // ignore
  }
}

export function restoreDraft(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.draftOdds);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<OddsState>;
    if (Array.isArray(parsed.rows)) {
      oddsStore.set({
        teamName: typeof parsed.teamName === "string" ? parsed.teamName : "",
        bookmaker: typeof parsed.bookmaker === "string" ? parsed.bookmaker : "",
        rows: parsed.rows as OddsFormRow[],
        customLines: Array.isArray(parsed.customLines) ? (parsed.customLines as OddsFormRow[]) : [],
      });
    }
  } catch {
    // ignore corrupt drafts
  }
}
