import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <ChromeShell chrome="product" footer={<BottomNavigation />}>
      {children}
    </ChromeShell>
  );
}
