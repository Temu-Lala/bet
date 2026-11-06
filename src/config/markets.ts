/** Market configuration consumed by the odds input screen. */

export interface MarketRowConfig {
  line: number;
  underLabel: string;
  overLabel: string;
  marketType: "STANDARD" | "ASIAN";
  hint: string;
}

export const GOAL_MARKET_ROWS: MarketRowConfig[] = [
  { line: 0.5, underLabel: "Under 0.5", overLabel: "Over 0.5", marketType: "STANDARD", hint: "0 goals vs 1+" },
  { line: 1.5, underLabel: "Under 1.5", overLabel: "Over 1.5", marketType: "STANDARD", hint: "0-1 goals vs 2+" },
  { line: 2.5, underLabel: "Under 2.5", overLabel: "Over 2.5", marketType: "STANDARD", hint: "0-2 goals vs 3+" },
  { line: 3.5, underLabel: "Under 3.5", overLabel: "Over 3.5", marketType: "STANDARD", hint: "0-3 goals vs 4+" },
  { line: 4.5, underLabel: "Under 4.5", overLabel: "Over 4.5", marketType: "STANDARD", hint: "0-4 goals vs 5+" },
  { line: 5.0, underLabel: "Asian Under 5.0", overLabel: "Asian Over 5.0", marketType: "ASIAN", hint: "push at exactly 5" },
  { line: 5.5, underLabel: "Asian Under 5.5", overLabel: "Asian Over 5.5", marketType: "ASIAN", hint: "no push" },
];
