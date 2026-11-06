import { Icon } from "./Icon";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span className="rounded-full bg-surface-muted p-3 text-foreground/40">
        <Icon name="dot" className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-foreground/50">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Calculating…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-10 text-sm text-foreground/60">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorMessage({
  message,
  details,
}: {
  message: string;
  details?: string[];
}) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-danger">
          <Icon name="warning" />
        </span>
        <div>
          <p className="text-sm font-medium text-danger">{message}</p>
          {details && details.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-foreground/60">
              {details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
