import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";

/**
 * System chrome — AppViewport only; no five-tab BottomNavigation.
 */
export default function SystemLayout({ children }: { children: ReactNode }) {
  return <ChromeShell chrome="system">{children}</ChromeShell>;
}
