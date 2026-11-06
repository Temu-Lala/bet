import type { MarketBoundary, ProbabilityResult } from "../../../types/probability";
import type { DerivativeEstimate, RangeComparison } from "../../../types/market";
import { fairOddsFromProbability } from "../advanced/expected-value";

/**
 * Model vs market comparison. Two rules govern this module:
 *
 *  1. A market-derived range probability is only produced when the
 *     bracketing complete (both-sides quoted) standard .5 anchors
 *     exist. Anything else reports `null` with an explanatory note -
 *     the fitted model never "subtracts the market" for boundaries it
 *     does not have, and the model estimate is never disguised as a
 *     market number.
 *  2. Every number carries its source. Derivative estimates below come
 *     from the fitted distribution, so they are labelled as such; the
 *     fitted lambda describes total team goals in this engine, which is
 *     exactly what the goal markets price.
 */

/**
 * Only both-sides-quoted standard .5 anchors are valid market-range
 * inputs: whole and quarter Asian lines carry push semantics (their
 * probability is push-adjusted) and one-sided prices still contain the
 * margin, so subtracting them would fabricate a market estimate.
 */
function isPureMarketAnchor(anchor: MarketBoundary): boolean {
  return anchor.complete && Math.abs(anchor.line % 1) === 0.5;
}

function cdfAt(anchors: MarketBoundary[], k: number): number | null {
  const hit = anchors.find((a) => isPureMarketAnchor(a) && a.k === k);
  return hit ? hit.probability : null;
}

/**
 * Market-derived probability for one goal range via margin-removed
 * cumulative subtraction, when honestly derivable from the prices given.
 */
export function marketRangeProbability(
  anchors: MarketBoundary[],
  min: number,
  max: number | null,
): { probability: number; notes: string[] } | null {
  const notes: string[] = [];
  const upper = max === null ? 1 : cdfAt(anchors, max);
  if (upper === null) {
    if (max === null) {
      // 6+ needs only the P(<=5) anchor.
      const low = cdfAt(anchors, min - 1);
      if (low === null) return null;
      notes.push(`Derived as 1 - P(X<=${min - 1}) from the complete ${(min - 1) + 0.5} market`);
      return { probability: 1 - low, notes };
    }
    return null;
  }
  let lower = 0;
  if (min > 0) {
    const l = cdfAt(anchors, min - 1);
    if (l === null) return null;
    lower = l;
  }
  notes.push(
    `Derived as P(X<=${max}) - P(X<=${min - 1}) from complete .5 markets (margin removed)`,
  );
  return { probability: upper - lower, notes };
}

export function compareModelToMarket(result: ProbabilityResult): RangeComparison[] {
  const pureAnchors = result.marketBoundaries.filter(isPureMarketAnchor);

  return result.goalRanges.map((range) => {
    const modelProbability = range.probability;
    const market = marketRangeProbability(pureAnchors, range.min, range.max);
    const diff = market ? modelProbability - market.probability : null;
    const notes: string[] = [];
    if (!market) {
      notes.push(
        "Market estimate not derivable: complete both-sides .5 markets bracketing this range were not provided. The model value here is a Poisson estimate, not a market subtraction.",
      );
    }
    return {
      label: range.label,
      min: range.min,
      max: range.max,
      modelProbability,
      marketProbability: market ? market.probability : null,
      fairOddsModel:
        modelProbability > 0 && modelProbability < 1 ? fairOddsFromProbability(modelProbability) : null,
      fairOddsMarket:
        market && market.probability > 0 && market.probability < 1
          ? fairOddsFromProbability(market.probability)
          : null,
      difference: diff,
      notes,
    };
  });
}

/**
 * Derivative markets estimated from the fitted distribution. These have
 * no bookmaker price in the input, so they are model-only by definition
 * and are presented with their exact closed form for auditability.
 */
export function derivativeEstimates(result: ProbabilityResult): DerivativeEstimate[] {
  const at = (goals: number): number =>
    result.exactGoals.find((e) => e.goals === goals)?.probability ?? 0;
  const cdf = (k: number): number =>
    result.cumulativeProbabilities[`P(X<=${k})`] ?? 1;
  const safe = (p: number): number | null =>
    p > 0 && p < 1 ? fairOddsFromProbability(p) : null;

  const rows: { label: string; probability: number; formula: string }[] = [
    { label: "Exactly 0 goals (clean sheet)", probability: at(0), formula: "P(X=0)" },
    { label: "Exactly 1 goal", probability: at(1), formula: "P(X=1)" },
    { label: "Exactly 2 goals", probability: at(2), formula: "P(X=2)" },
    { label: "2 or 3 goals", probability: at(2) + at(3), formula: "P(X=2) + P(X=3)" },
    { label: "Team Over 0.5", probability: 1 - cdf(0), formula: "1 - P(X<=0)" },
    { label: "Team Over 1.5", probability: 1 - cdf(1), formula: "1 - P(X<=1)" },
    { label: "Team Over 2.5", probability: 1 - cdf(2), formula: "1 - P(X<=2)" },
    { label: "Team Over 3.5", probability: 1 - cdf(3), formula: "1 - P(X<=3)" },
  ];
  return rows.map((r) => ({
    label: r.label,
    probability: r.probability,
    fairOdds: safe(r.probability),
    formula: r.formula,
  }));
}
