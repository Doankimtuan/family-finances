import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export function ContentLoadingShell({ children }: { children: ReactNode }) {
  return (
    <AppShell footer={<BottomTabBar />}>
      <section className="w-full animate-pulse space-y-4" aria-busy="true" aria-live="polite">
        {children}
      </section>
    </AppShell>
  );
}
