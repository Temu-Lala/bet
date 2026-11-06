"use client";

import { useEffect } from "react";
import { hydrateSettings } from "@/stores/settings-store";

/**
 * Theme provider: hydrates persisted settings on mount. The initial class
 * is applied by an inline script in the root layout to avoid a flash of
 * the wrong theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateSettings();
  }, []);

  return <>{children}</>;
}
