import type { MarketOdds } from "../../types/probability";
import { validateMarkets, parseOddsValue } from "../probability/markets/market-validation";
import type { ValidationResult } from "../../types/odds";

/**
 * Zod-style schema layer implemented with the engine's own validators:
 * the odds form produces string rows; this module is the single boundary
 * where strings become typed MarketOdds and validation happens.
 */

export interface OddsFormRow {
  line: number;
  marketType: "STANDARD" | "ASIAN";
  under: string;
  over: string;
}

export function rowsToMarkets(rows: OddsFormRow[]): MarketOdds[] {
  return rows.map((row) => ({
    line: row.line,
    under: toNumberOrNull(row.under),
    over: toNumberOrNull(row.over),
    marketType: row.marketType,
  }));
}

function toNumberOrNull(raw: string): number | null {
  const value = parseOddsValue(raw);
  if (value === null) return null;
  return Number.isNaN(value) ? Number.NaN : value;
}

export function validateRows(rows: OddsFormRow[]): ValidationResult {
  return validateMarkets(rowsToMarkets(rows));
}
