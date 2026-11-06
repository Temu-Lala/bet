import type { MarketOdds } from "../../../types/probability";
import type { ValidationIssue, ValidationResult } from "../../../types/odds";

/**
 * Odds validation rules. Each failure mode is kept distinct on purpose:
 * missing data, invalid data, incomplete market, inconsistent market.
 * Missing odds are never silently replaced with assumed values.
 */

export const MIN_VALID_ODDS = 1.01;

export function parseOddsValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : Number.NaN;
}

export function validateMarkets(markets: MarketOdds[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  const seenLines = new Map<string, number>();
  let usablePairs = 0;
  let oneSided = 0;

  for (const market of markets) {
    const field = `market ${market.line}`;

    if (!Number.isFinite(market.line) || market.line < 0) {
      issues.push({
        code: "INVALID_DATA",
        field,
        message: `Goal line must be a non-negative number`,
        severity: "error",
      });
      continue;
    }

    const key = `${market.marketType}:${market.line}`;
    if (seenLines.has(key)) {
      issues.push({
        code: "DUPLICATE_LINE",
        field,
        message: `Duplicate ${market.marketType} line ${market.line}; only the first entry is used`,
        severity: "warning",
      });
    } else {
      seenLines.set(key, market.line);
    }

    for (const side of ["under", "over"] as const) {
      const odds = market[side];
      if (odds === null || odds === undefined) continue;
      if (!Number.isFinite(odds)) {
        issues.push({
          code: "INVALID_DATA",
          field,
          message: `${side} odds must be a valid decimal number`,
          severity: "error",
        });
      } else if (odds <= MIN_VALID_ODDS) {
        issues.push({
          code: "INVALID_DATA",
          field,
          message: `${side} odds ${odds} must be greater than 1.00`,
          severity: "error",
        });
      }
    }

    const hasUnder = market.under !== null && market.under > MIN_VALID_ODDS;
    const hasOver = market.over !== null && market.over > MIN_VALID_ODDS;

    if (hasUnder && hasOver) {
      usablePairs++;
    } else if (hasUnder || hasOver) {
      oneSided++;
      issues.push({
        code: "INCOMPLETE_MARKET",
        field,
        message: `Only the ${hasUnder ? "under" : "over"} side is provided; this market cannot be margin-normalized`,
        severity: "warning",
      });
    }
  }

  if (usablePairs === 0) {
    issues.push({
      code: "NO_USABLE_MARKETS",
      field: "markets",
      message: oneSided > 0
        ? "No complete Over/Under market pair is available; at least one market needs both sides"
        : "Enter at least one complete Over/Under market pair to calculate probabilities",
      severity: "error",
    });
  }

  return {
    valid: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
