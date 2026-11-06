import type { MarketOdds } from "../../../types/probability";

/** Static goal-line market catalog shared by the engine and the UI. */

export const STANDARD_GOAL_LINES = [0.5, 1.5, 2.5, 3.5, 4.5] as const;
export const ASIAN_GOAL_LINES = [5.0, 5.5] as const;

export function marketLabel(line: number, side: "UNDER" | "OVER", marketType: "STANDARD" | "ASIAN"): string {
  const prefix = marketType === "ASIAN" ? (side === "OVER" ? "Asian Over" : "Asian Under") : side === "OVER" ? "Over" : "Under";
  return `${prefix} ${line.toFixed(1)}`;
}

/** Build the empty market scaffold used by the analyzer form. */
export function defaultMarketScaffold(): MarketOdds[] {
  return [
    ...STANDARD_GOAL_LINES.map((line) => ({
      line,
      under: null,
      over: null,
      marketType: "STANDARD" as const,
    })),
    ...ASIAN_GOAL_LINES.map((line) => ({
      line,
      under: null,
      over: null,
      marketType: "ASIAN" as const,
    })),
  ];
}

/** Sample odds from the architecture document (illustrative, not defaults). */
export function sampleMarketOdds(): MarketOdds[] {
  return [
    { line: 0.5, under: 11.5, over: 1.05, marketType: "STANDARD" },
    { line: 1.5, under: 3.75, over: 1.28, marketType: "STANDARD" },
    { line: 2.5, under: null, over: null, marketType: "STANDARD" },
    { line: 3.5, under: 1.38, over: 3.25, marketType: "STANDARD" },
    { line: 4.5, under: 1.13, over: null, marketType: "STANDARD" },
    { line: 5.0, under: null, over: 11.5, marketType: "ASIAN" },
    { line: 5.5, under: null, over: null, marketType: "ASIAN" },
  ];
}
