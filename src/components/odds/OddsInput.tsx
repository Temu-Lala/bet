export function OddsInput({
  label,
  value,
  onChange,
  invalid = false,
  placeholder = "—",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[11px] font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`tabular w-24 rounded-lg border bg-surface px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-foreground/30 focus:ring-2 ${
          invalid
            ? "border-danger focus:ring-danger/20"
            : "border-border focus:border-accent focus:ring-accent/20"
        }`}
      />
    </label>
  );
}
