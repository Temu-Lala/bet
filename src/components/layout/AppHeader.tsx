"use client";

import { usePathname } from "next/navigation";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { useStoreSelector } from "@/lib/utils/store";
import { settingsStore, updateSettings } from "@/stores/settings-store";
import { Icon } from "@/components/common/Icon";

export function AppHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const theme = useStoreSelector(settingsStore, (s) => s.theme);
  const current = NAVIGATION_ITEMS.find((item) => pathname.startsWith(item.href));

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="rounded-md p-2 text-foreground/70 hover:bg-surface-muted md:hidden"
          aria-label="Open navigation"
        >
          <Icon name="menu" />
        </button>
        <div>
          <h1 className="text-sm font-semibold tracking-tight md:text-base">
            {current?.label ?? "Football Probability Analyzer"}
          </h1>
          <p className="hidden text-xs text-foreground/50 sm:block">
            {current?.description ?? "Independent probability engine"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] text-foreground/60 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Engine active · local calculations
        </span>
        <button
          onClick={() => updateSettings({ theme: theme === "dark" ? "light" : "dark" })}
          className="rounded-md p-2 text-foreground/70 hover:bg-surface-muted"
          aria-label="Toggle theme"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </div>
    </header>
  );
}
