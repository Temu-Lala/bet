"use client";

import { useState } from "react";
import { AppSidebar } from "./AppSidebar";

/**
 * Mobile navigation: renders the sidebar in an overlay drawer below the
 * md breakpoint. Desktop users always see the persistent sidebar.
 */
export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 w-64">
        <AppSidebar mobileOpen onClose={onClose} />
      </div>
    </div>
  );
}

/** Hook pairing the header menu button with the drawer. */
export function useMobileNav(): { open: boolean; openNav: () => void; closeNav: () => void } {
  const [open, setOpen] = useState(false);
  return { open, openNav: () => setOpen(true), closeNav: () => setOpen(false) };
}
