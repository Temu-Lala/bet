"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileNavigation, useMobileNav } from "@/components/layout/MobileNavigation";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { open, openNav, closeNav } = useMobileNav();

  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <MobileNavigation open={open} onClose={closeNav} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onOpenMenu={openNav} />
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
