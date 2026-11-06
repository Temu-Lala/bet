export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  const toneClass = {
    default: "text-foreground",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <p className={`tabular mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-foreground/50">{sub}</p>}
    </div>
  );
}
