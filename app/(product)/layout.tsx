import type { ReactNode } from "react";
import { AppViewport } from "@/shared/patterns/app-viewport";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <AppViewport>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </AppViewport>
  );
}
