import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AuthHouseGlow } from "@/shared/patterns/auth-house-glow";

export type AuthScreenShellProps = {
  children: ReactNode;
  testId?: string;
  /** Center content vertically with auth token padding/gap. */
  centered?: boolean;
  /** Soft house silhouette wash behind content (auth marketing screens). */
  withGlow?: boolean;
  className?: string;
};

/**
 * Full-height column for auth/system screens inside ChromeShell.
 */
export function AuthScreenShell({
  children,
  testId,
  centered = false,
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
          centered && "justify-center px-(--space-4) py-(--space-6)",
          withGlow && "pb-(--space-16)",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[22rem] flex-col",
            centered ? "gap-(--space-5)" : "gap-(--space-4)",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
