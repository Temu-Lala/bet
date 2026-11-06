import { formatPercentage } from "@/lib/utils/format-percentage";
import { cn } from "@/lib/utils/cn";

/** Probability badge; colors shift with magnitude for fast scanning. */
export function PercentageBadge({
  probability,
  precision = 2,
  className,
}: {
  probability: number;
  precision?: number;
  className?: string;
}) {
  const tone =
    probability >= 0.6
      ? "bg-success/10 text-success"
      : probability >= 0.3
        ? "bg-accent-soft text-accent"
        : probability > 0
          ? "bg-surface-muted text-foreground/60"
          : "bg-surface-muted text-foreground/40";

  return (
    <span
      className={cn(
        "tabular inline-flex min-w-[64px] justify-center rounded-md px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      {formatPercentage(probability, precision)}
    </span>
  );
}
