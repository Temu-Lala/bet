import type { MarketOdds } from "../../../types/probability";

/**
 * Step 1 of the pipeline: turn raw form input into validated market objects.
 * Empty rows are dropped, lines snap to the 0.25 grid the betting markets
 * actually use, and duplicate lines are resolved explicitly (first wins).
 */
export function normalizeMarkets(raw: MarketOdds[]): {
  markets: MarketOdds[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const markets: MarketOdds[] = [];

  for (const market of raw) {
    if (!Number.isFinite(market.line)) continue;

    const hasUnder = market.under !== null && market.under !== undefined;
    const hasOver = market.over !== null && market.over !== undefined;
    if (!hasUnder && !hasOver) continue; // empty market: ignore, not an error

    const line = Math.round(market.line * 4) / 4;
    if (Math.abs(line - market.line) > 1e-9) {
      warnings.push(`Goal line ${market.line} snapped to the nearest quarter line ${line}`);
    }

    const key = `${market.marketType}:${line}`;
    if (seen.has(key)) {
      warnings.push(`Duplicate ${market.marketType} line ${line} ignored (first entry kept)`);
      continue;
    }
    seen.add(key);

    markets.push({
      line,
      under: hasUnder ? market.under! : null,
      over: hasOver ? market.over! : null,
      marketType: market.marketType === "ASIAN" ? "ASIAN" : "STANDARD",
    });
  }

  markets.sort((a, b) => a.line - b.line);
  return { markets, warnings };
}
