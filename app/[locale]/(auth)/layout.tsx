import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";

/**
 * Auth/System chrome — AppViewport only; no five-tab BottomNavigation.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <ChromeShell chrome="auth">{children}</ChromeShell>;
}
