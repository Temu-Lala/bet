import {
  decimalToAmerican,
  decimalToFractional,
} from "../probability/odds/odds-conversion";

export type OddsFormat = "DECIMAL" | "AMERICAN" | "FRACTIONAL";

export function formatOdds(
  decimalOdds: number | null,
  format: OddsFormat = "DECIMAL",
): string {
  if (decimalOdds === null || !Number.isFinite(decimalOdds) || decimalOdds <= 1) {
    return "—";
  }
  switch (format) {
    case "DECIMAL":
      return decimalOdds.toFixed(2);
    case "AMERICAN": {
      const value = decimalToAmerican(decimalOdds);
      return value > 0 ? `+${value}` : String(value);
    }
    case "FRACTIONAL":
      return decimalToFractional(decimalOdds);
  }
}
