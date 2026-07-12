"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { CommandPalette } from "@/components/layout/command-palette";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { QuickTransactionModal } from "@/components/layout/quick-transaction-modal";
import { Sidebar } from "@/components/layout/sidebar";
import { useFinance } from "@/contexts/finance-context";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences } = useFinance();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    preferences.sidebar_collapsed
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickTransactionOpen, setQuickTransactionOpen] = useState(false);

  const handleSidebarCollapsedChange = useCallback(
    (collapsed: boolean) => {
      setSidebarCollapsed(collapsed);
      updatePreferences({ sidebar_collapsed: collapsed });
    },
    [updatePreferences]
  );

  const openQuickTransaction = useCallback(() => {
    setQuickTransactionOpen(true);
  }, []);

  return (
    <div className="min-h-dvh">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={handleSidebarCollapsedChange}
      />

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div
        className={cn(
          "min-h-dvh transition-[padding-left] duration-300 ease-out",
          sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[280px]"
        )}
      >
        <Header
          onOpenCommand={() => setCommandOpen(true)}
          onOpenQuickTransaction={openQuickTransaction}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onCreateTransaction={openQuickTransaction}
      />
      <QuickTransactionModal
        open={quickTransactionOpen}
        onOpenChange={setQuickTransactionOpen}
      />
    </div>
  );
}
