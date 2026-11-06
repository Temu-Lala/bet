export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-sm text-foreground/60">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        Loading analysis workspace…
      </div>
    </div>
  );
}
