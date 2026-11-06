"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { APP_CONFIG } from "@/config/app";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/common/Icon";

export function AppSidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">{APP_CONFIG.name}</p>
          <p className="mt-0.5 text-[11px] text-foreground/50">{APP_CONFIG.tagline}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-surface-muted md:hidden"
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-foreground/70 hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <span className="mt-0.5">
                    <Icon name={item.icon} />
                  </span>
                  <span>
                    <span className="block leading-5">{item.label}</span>
                    <span className="block text-[11px] leading-4 text-foreground/40">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-5 py-3 text-[11px] text-foreground/40">
        v{APP_CONFIG.version} · calculations run locally in your browser
      </div>
    </aside>
  );
}
