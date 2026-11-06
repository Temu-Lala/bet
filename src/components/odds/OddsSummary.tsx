import { removeMarginTwoWay } from "@/lib/probability/odds/margin-removal";
import { overround } from "@/lib/probability/odds/overround";
import type { MarketOdds } from "@/types/probability";
import { formatPercentage } from "@/lib/utils/format-percentage";

/**
 * Live odds summary: market-implied probabilities per line (clearly
 * separated from model output) and the bookmaker margin.
 */
export function OddsSummary({ markets }: { markets: MarketOdds[] }) {
  const usable = markets.filter((m) => m.under !== null && m.over !== null);

  if (usable.length === 0) {
    return (
      <p className="text-xs text-foreground/50">
        No complete market pair entered yet. The margin summary appears once at
        least one Under/Over pair is provided.
      </p>
    );
  }

  const avgMargin =
    usable.reduce((sum, m) => sum + overround([m.under!, m.over!]), 0) / usable.length;

  return (
    <div className="space-y-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-foreground/50">
            <th className="py-1 font-medium">Line</th>
            <th className="py-1 text-right font-medium">P(under)</th>
            <th className="py-1 text-right font-medium">P(over)</th>
            <th className="py-1 text-right font-medium">Margin</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {usable.map((m) => {
            const { under, over } = removeMarginTwoWay(m.under!, m.over!);
            const margin = overround([m.under!, m.over!]);
            return (
              <tr key={`${m.marketType}:${m.line}`} className="border-t border-border/60">
                <td className="py-1.5">
                  {m.marketType === "ASIAN" ? "Asian " : ""}
                  {m.line.toFixed(1)}
                </td>
                <td className="py-1.5 text-right">{formatPercentage(under)}</td>
                <td className="py-1.5 text-right">{formatPercentage(over)}</td>
                <td className="py-1.5 text-right text-foreground/60">{formatPercentage(margin)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-foreground/50">
        Average bookmaker margin across complete markets:{" "}
        <span className="tabular font-medium text-foreground">{formatPercentage(avgMargin)}</span>
        . Probabilities shown are market-implied after margin removal — distinct from
        model-fitted output.
      </p>
    </div>
  );
}
