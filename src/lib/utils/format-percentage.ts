/** Presentation-layer percentage formatting. The engine only speaks decimals. */

export function formatPercentage(
  probability: number,
  digits = 2,
): string {
  if (!Number.isFinite(probability)) return "—";
  return `${(probability * 100).toFixed(digits)}%`;
}

/** Decimal odds -> implied percentage, guarded against invalid input. */
export function impliedPercentage(decimalOdds: number, digits = 2): string {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return "—";
  return formatPercentage(1 / decimalOdds, digits);
}

export function formatExpectedGoals(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}
