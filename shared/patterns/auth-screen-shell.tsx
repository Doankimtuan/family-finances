import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type AuthScreenShellProps = {
  children: ReactNode;
  testId?: string;
  /** Center content vertically with auth token padding/gap. */
  centered?: boolean;
  className?: string;
};

/**
 * Full-height column for auth/system screens inside ChromeShell.
 */
export function AuthScreenShell({
  children,
  testId,
  centered = false,
  className,
}: AuthScreenShellProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        centered &&
          "justify-center gap-(--space-5) px-(--space-4) py-(--space-6)",
        className,
      )}
    >
      {children}
    </div>
  );
}
