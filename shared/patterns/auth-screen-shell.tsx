import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AuthHouseGlow } from "@/shared/patterns/auth-house-glow";

export type AuthScreenShellAlign = "center" | "start";

/** Full-width auth primary action — 56px, keeps dimensions while pending. */
export const AUTH_PRIMARY_ACTION_CLASS_NAME =
  "min-h-14 w-full text-base font-semibold";

export function authCrossLinkClassName(disabled = false, className?: string) {
  return cn(
    "inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    disabled && "pointer-events-none opacity-50",
    className,
  );
}

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
  /** Communicates in-flight submission to assistive technology. */
  busy?: boolean;
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
  busy = false,
  className,
}: AuthScreenShellProps) {
  return (
    <div
      data-testid={testId}
      aria-busy={busy || undefined}
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
