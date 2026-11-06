import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="font-mono text-5xl font-bold text-accent">404</p>
      <h2 className="text-lg font-semibold">Screen not found</h2>
      <p className="max-w-sm text-sm text-foreground/60">
        The page you are looking for does not exist in this workspace.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
