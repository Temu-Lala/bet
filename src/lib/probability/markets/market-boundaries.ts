import type { MarketOdds, MarketBoundary } from "../../../types/probability";
import type { MarketWeights } from "../../../types/odds";
import { impliedProbability } from "../odds/implied-probability";
import { removeMarginTwoWay, type MarginMethod } from "../odds/margin-removal";
import { isWholeLine } from "../odds/asian-settlement";

/**
 * Market boundary extraction: turn bookmaker prices into cumulative anchors
 * P(X <= k) that the statistical model is fitted against.
 *
 * Semantics by line type:
 *  - Standard / asian half line (K.5): Under wins iff X <= K  -> pure CDF anchor.
 *  - Asian whole line (K.0): Under wins iff X < K, push iff X = K.
 *    The normalized price reflects P(X <= K) - 0.5 * P(X = K), so the anchor
 *    carries `halfPushAt` and the fitter subtracts half the pmf at K.
 *
 * Weighting policy (reported honestly, never silently assumed):
 *  - complete two-way markets: weight 1.0 (0.8 for whole asian lines)
 *  - one-sided markets: raw probability still contains the bookmaker margin,
 *    so they get weight 0.3 and an explanatory note.
 * All three defaults are configurable per category via MarketWeights; a
 * weight of zero excludes that category from the fit entirely.
 */

export const DEFAULT_MARKET_WEIGHTS: MarketWeights = {
  completeStandard: 1.0,
  completeAsianWhole: 0.8,
  oneSided: 0.3,
};

/**
 * Resolve one category weight: only a finite number in [0, 2] is honored;
 * anything else falls back to the engine default rather than guessing.
 */
function resolveWeight(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 0 || value > 2) return fallback;
  return value;
}

export interface BoundaryAnchor extends MarketBoundary {
  /** When set, the model probability is F(k) - 0.5 * f(k) at this goal count. */
  halfPushAt: number | null;
}

export function modelProbability(anchor: BoundaryAnchor, model: {
  cdf(k: number, lambda: number): number;
  pmf(k: number, lambda: number): number;
}, lambda: number): number {
  const base = model.cdf(anchor.k, lambda);
  if (typeof anchor.halfPushAt === "number") {
    return base - 0.5 * model.pmf(anchor.halfPushAt, lambda);
  }
  return base;
}

export function extractMarketBoundaries(
  markets: MarketOdds[],
  marginMethod: MarginMethod = "MULTIPLICATIVE",
  weights: Partial<MarketWeights> = {},
): BoundaryAnchor[] {
  const anchors: BoundaryAnchor[] = [];
  const wComplete = resolveWeight(weights.completeStandard, DEFAULT_MARKET_WEIGHTS.completeStandard);
  const wAsian = resolveWeight(weights.completeAsianWhole, DEFAULT_MARKET_WEIGHTS.completeAsianWhole);
  const wOneSided = resolveWeight(weights.oneSided, DEFAULT_MARKET_WEIGHTS.oneSided);

  for (const market of markets) {
    const { line, under, over, marketType } = market;
    if (line < 0) continue; // rejected earlier by validation, defensive here

    const k = Math.floor(line);
    const notes: string[] = [];
    const hasUnder = under !== null && under > 1;
    const hasOver = over !== null && over > 1;

    const isWholeAsian = marketType === "ASIAN" && isWholeLine(line);
    const halfPushAt = isWholeAsian ? k : null;

    if (hasUnder && hasOver) {
      const { under: pUnder } = removeMarginTwoWay(under!, over!, marginMethod);
      const weight = isWholeAsian ? wAsian : wComplete;
      if (isWholeAsian) {
        notes.push(
          `Asian whole line ${line.toFixed(1)}: push at ${k} goals accounted for (half-pmf correction)`,
        );
      }
      if (weight === 0) {
        notes.push("Zero reliability weight: excluded from the model fit");
      }
      anchors.push({
        line,
        k,
        probability: pUnder,
        weight,
        complete: true,
        notes,
        halfPushAt,
      });
      continue;
    }

    if (hasUnder || hasOver) {
      // One-sided market: the raw implied probability is biased upward by the
      // bookmaker margin. Keep it as a low-weight anchor, do NOT normalize.
      const odds = hasUnder ? under! : over!;
      const raw = impliedProbability(odds);
      const probability = hasUnder ? raw : 1 - raw;
      notes.push(
        `Market ${marketType === "ASIAN" ? "O/U" : "U/O"} ${line} is incomplete (only ${
          hasUnder ? "under" : "over"
        } provided): raw probability includes the bookmaker margin`,
      );
      anchors.push({
        line,
        k,
        probability,
        weight: wOneSided,
        complete: false,
        notes: wOneSided === 0
          ? [...notes, "Zero reliability weight: excluded from the model fit"]
          : notes,
        halfPushAt,
      });
    }
  }

  return anchors.sort((a, b) => a.k - b.k);
}
