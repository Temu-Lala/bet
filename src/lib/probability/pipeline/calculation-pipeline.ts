import type { MarketOdds, MarketBoundary } from "../../../types/probability";
import type { ValidationIssue, MarketWeights } from "../../../types/odds";
import type { MarginMethod } from "../odds/margin-removal";
import { normalizeMarkets } from "./input-normalizer";
import { extractMarketBoundaries, type BoundaryAnchor } from "../markets/market-boundaries";
import { validateMarkets } from "../markets/market-validation";
import { checkMarketConsistency } from "../markets/market-consistency";
import { fitModelToMarkets, type FittedModel } from "../models/fitted-poisson";

/**
 * The full processing sequence, exposed as inspectable steps:
 *
 *   1. input normalization          -> markets
 *   2. implied probability + margin -> anchors (steps 2-4 combined)
 *   3. market boundary extraction
 *   4. consistency checks
 *   5. statistical model fitting
 */

export interface PipelineStage1 {
  markets: MarketOdds[];
  normalizationWarnings: string[];
  validationIssues: ValidationIssue[];
}

export interface PipelineStage2 extends PipelineStage1 {
  anchors: BoundaryAnchor[];
  consistencyWarnings: string[];
}

export interface PipelineStage3 extends PipelineStage2 {
  fitted: FittedModel;
}

export function stage1Normalize(rawMarkets: MarketOdds[]): PipelineStage1 {
  const { markets, warnings: normalizationWarnings } = normalizeMarkets(rawMarkets);
  const validation = validateMarkets(markets);
  return { markets, normalizationWarnings, validationIssues: validation.issues };
}

export function stage2ExtractBoundaries(
  markets: MarketOdds[],
  marginMethod: MarginMethod,
  marketWeights?: Partial<MarketWeights>,
): { anchors: BoundaryAnchor[]; consistencyWarnings: string[] } {
  const anchors = extractMarketBoundaries(markets, marginMethod, marketWeights ?? {});
  const consistencyWarnings = checkMarketConsistency(anchors);
  return { anchors, consistencyWarnings };
}

export function stage3Fit(
  anchors: BoundaryAnchor[],
  kind: "POISSON" | "NEGATIVE_BINOMIAL",
  maxGoals: number,
  nbDispersion?: number,
): FittedModel {
  return fitModelToMarkets(anchors, kind, maxGoals, nbDispersion);
}

/** Public helper so the UI can show market anchors separately from model output. */
export function asMarketBoundaries(anchors: BoundaryAnchor[]): MarketBoundary[] {
  return anchors.map(({ notes, k, line, probability, weight, complete }) => ({
    line,
    k,
    probability,
    weight,
    complete,
    notes,
  }));
}
