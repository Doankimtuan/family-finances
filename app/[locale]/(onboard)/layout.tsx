import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";

/**
 * Onboarding chrome — no BottomNav (nav group: onboarding).
 */
export default function OnboardLayout({ children }: { children: ReactNode }) {
  return <ChromeShell chrome="auth">{children}</ChromeShell>;
}
