import type { ReactNode } from "react";
import { AppViewport } from "@/shared/patterns/app-viewport";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <AppViewport>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-(--space-4) py-(--space-4)">
        {children}
      </main>
      <BottomNavigation />
    </AppViewport>
  );
}
