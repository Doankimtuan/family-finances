import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";

/**
 * Invite deep-link chrome — no BottomNav until membership exists.
 */
export default function InviteLayout({ children }: { children: ReactNode }) {
  return <ChromeShell chrome="auth">{children}</ChromeShell>;
}
