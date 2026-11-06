import type { BoundaryAnchor } from "./market-boundaries";

/**
 * Market consistency checks. Bookmaker prices across different goal lines
 * can contradict each other; the engine must surface this instead of
 * averaging it away.
 */
export function checkMarketConsistency(anchors: BoundaryAnchor[]): string[] {
  const warnings: string[] = [];

  // Cumulative probabilities must be non-decreasing with the goal threshold.
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    if (curr.k === prev.k) {
      if (Math.abs(curr.probability - prev.probability) > 0.05) {
        warnings.push(
          `Lines ${prev.line} and ${curr.line} both map to ${curr.k} goals but disagree by ${(
            Math.abs(curr.probability - prev.probability) * 100
          ).toFixed(1)} percentage points`,
        );
      }
    } else if (curr.probability < prev.probability - 0.02) {
      warnings.push(
        `Inconsistent prices: P(X<=${prev.k}) = ${(prev.probability * 100).toFixed(1)}% exceeds P(X<=${curr.k}) = ${(curr.probability * 100).toFixed(1)}% — at least one of these markets is mispriced`,
      );
    }
  }

  // Overround sanity on complete markets.
  const complete = anchors.filter((a) => a.complete);
  if (complete.length === 0) {
    warnings.push("No complete market pair was provided; results rely on raw one-sided prices");
  }

  // A market that assigns <2% or >98% after normalization usually signals a
  // data-entry mistake worth flagging before fitting.
  for (const anchor of anchors) {
    if (anchor.complete && (anchor.probability < 0.02 || anchor.probability > 0.98)) {
      warnings.push(
        `Market ${anchor.line} implies an extreme probability (${(anchor.probability * 100).toFixed(1)}%) — please double-check the entered odds`,
      );
    }
  }

  return warnings;
}
