import type { OddsFormRow } from "@/lib/validation/odds.schema";
import type { MarketRowConfig } from "@/config/markets";
import { OddsInput } from "./OddsInput";

/**
 * One goal-line row: label, under/over inputs, status marker.
 * Every market is independently optional; incomplete rows are marked,
 * never auto-filled.
 */
export function MarketGroup({
  config,
  row,
  onChange,
  onRemove,
}: {
  config: Pick<MarketRowConfig, "line" | "underLabel" | "overLabel" | "marketType" | "hint">;
  row: OddsFormRow | undefined;
  onChange: (side: "under" | "over", value: string) => void;
  onRemove?: () => void;
}) {
  const under = row?.under ?? "";
  const over = row?.over ?? "";
  const hasAny = under !== "" || over !== "";
  const complete = hasAny && under !== "" && over !== "";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-2.5">
      <div className="min-w-[130px]">
        <p className="text-sm font-medium">
          {config.marketType === "ASIAN" ? "Asian " : ""}
          {config.line.toFixed(1)} goals
        </p>
        <p className="text-[11px] text-foreground/45">{config.hint}</p>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-4">
        <OddsInput label="Under" value={under} onChange={(v) => onChange("under", v)} />
        <OddsInput label="Over" value={over} onChange={(v) => onChange("over", v)} />

        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            !hasAny
              ? "bg-foreground/15"
              : complete
                ? "bg-success"
                : "bg-warning"
          }`}
          title={
            !hasAny ? "Empty market (ignored)" : complete ? "Complete market" : "Incomplete market (one side only)"
          }
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-xs text-foreground/40 hover:text-danger"
            aria-label={`Remove line ${config.line}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
