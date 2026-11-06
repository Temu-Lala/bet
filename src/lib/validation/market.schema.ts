import type { AsianPosition } from "../probability/odds/asian-settlement";

/**
 * Market schema: validates a standalone asian position entry (line, side,
 * odds, stake) used by the settlement panel on the analyzer screen.
 */
export interface AsianFormRow {
  line: string;
  side: "OVER" | "UNDER";
  odds: string;
  stake: string;
}

export function parseAsianPosition(row: AsianFormRow): {
  position: AsianPosition | null;
  error: string | null;
} {
  const line = Number(row.line);
  const odds = Number(row.odds);
  const stake = Number(row.stake);

  if (!Number.isFinite(line) || line < 0) {
    return { position: null, error: "Goal line must be a non-negative number" };
  }
  if (Math.round(line * 4) !== line * 4) {
    return { position: null, error: "Asian lines must be on a .0/.25/.5/.75 grid" };
  }
  if (!Number.isFinite(odds) || odds <= 1) {
    return { position: null, error: "Odds must be a decimal greater than 1.00" };
  }
  if (!Number.isFinite(stake) || stake <= 0) {
    return { position: null, error: "Stake must be a positive amount" };
  }

  return {
    position: { line, side: row.side, odds, stake },
    error: null,
  };
}
