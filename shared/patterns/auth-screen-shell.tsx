import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AuthHouseGlow } from "@/shared/patterns/auth-house-glow";

export type AuthScreenShellAlign = "center" | "start";

export type AuthScreenShellProps = {
  children: ReactNode;
  testId?: string;
  /** Center content vertically with auth token padding/gap (legacy interstitials). */
  centered?: boolean;
  /**
   * "start" — top-anchored product-like flow (welcome/login/onboard forms).
   * "center" — vertically centered interstitial (confirm/invite). Default.
   */
  align?: AuthScreenShellAlign;
  /** Soft house silhouette wash behind content (auth marketing screens). */
  withGlow?: boolean;
  className?: string;
};

/**
 * Full-height column for auth/system screens inside ChromeShell.
 * Keep one column: max-w-[22rem] on the canvas; no card-in-page framing.
 */
export function AuthScreenShell({
  children,
  testId,
  centered = false,
  align = centered ? "center" : "start",
  withGlow = false,
  className,
}: AuthScreenShellProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      {withGlow ? <AuthHouseGlow /> : null}
      <div
        data-slot="auth-scroll-region"
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain",
          align === "center"
            ? "justify-center px-(--space-4) py-(--space-6)"
            : "px-(--space-4) pt-(--space-5) pb-(--space-8)",
          withGlow && "pb-(--space-16)",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[22rem] flex-col gap-(--space-5)",
            align === "start" && "flex-1",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
