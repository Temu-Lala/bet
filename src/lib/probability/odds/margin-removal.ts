import { impliedProbability } from "./implied-probability";

export type MarginMethod = "MULTIPLICATIVE" | "ADDITIVE" | "POWER";

/**
 * Bookmaker margin removal for a two-way market.
 *
 * Multiplicative (default, proportional):
 *   P_U = (1/U) / ((1/U) + (1/O))
 *   P_O = (1/O) / ((1/U) + (1/O))
 *
 * Additive: subtract a share of the overround from each raw probability.
 * Power: raise raw probabilities to exponent k < 1 then renormalize.
 */
export function removeMarginTwoWay(
  underOdds: number,
  overOdds: number,
  method: MarginMethod = "MULTIPLICATIVE",
  powerExponent = 0.85,
): { under: number; over: number } {
  const rawUnder = impliedProbability(underOdds);
  const rawOver = impliedProbability(overOdds);
  const total = rawUnder + rawOver; // >= 1, excess is the bookmaker margin

  switch (method) {
    case "MULTIPLICATIVE":
      return { under: rawUnder / total, over: rawOver / total };

    case "ADDITIVE": {
      const halfMargin = (total - 1) / 2;
      const adjustedUnder = Math.max(rawUnder - halfMargin, 1e-6);
      const adjustedOver = Math.max(rawOver - halfMargin, 1e-6);
      const adjustedTotal = adjustedUnder + adjustedOver;
      return { under: adjustedUnder / adjustedTotal, over: adjustedOver / adjustedTotal };
    }

    case "POWER": {
      const pu = Math.pow(rawUnder, powerExponent);
      const po = Math.pow(rawOver, powerExponent);
      const poweredTotal = pu + po;
      return { under: pu / poweredTotal, over: po / poweredTotal };
    }

    default:
      throw new RangeError(`Unknown margin removal method: ${method}`);
  }
}

/** Margin removal for an arbitrary set of correlated raw probabilities. */
export function removeMarginMultiplicative(rawProbabilities: number[]): number[] {
  const total = rawProbabilities.reduce((s, p) => s + p, 0);
  if (!(total > 0)) {
    throw new RangeError("Cannot remove margin from non-positive probabilities");
  }
  return rawProbabilities.map((p) => p / total);
}
