import type { ReactNode } from "react";

export const ICONS: Record<string, string> = {
  /* Minimal stroke icon paths (24x24 grid) — no icon library needed. */
};

export function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) {
  const path = ICON_PATHS[name] ?? ICON_PATHS.dot;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {path}
    </svg>
  );
}

const ICON_PATHS: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  analyzer: (
    <>
      <path d="M3 20h18" />
      <path d="M6 16v-4M11 16V7M16 16v-6M20 16V5" />
    </>
  ),
  value: (
    <>
      <path d="M12 3v17" />
      <path d="M5 7h14" />
      <path d="M7 7l-3.5 6h7L7 7z" />
      <path d="M17 7l-3.5 6h7L17 7z" />
      <path d="M8 20h8" />
    </>
  ),
  goal: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l4.5 3.3-1.7 5.4h-5.6L7.5 10.3 12 7z" />
    </>
  ),
  score: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),
  match: (
    <>
      <path d="M4 20L20 4" />
      <path d="M15 4h5v5" />
      <path d="M4 15v5h5" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 13l4 4L19 7" />,
  warning: (
    <>
      <path d="M12 3L2 21h20L12 3z" />
      <path d="M12 10v4M12 17.5v.5" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4" />,
};
