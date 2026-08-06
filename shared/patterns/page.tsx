import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type PageProps = {
  topBar?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  testId?: string;
};

/**
 * Product screen layout inside the 440px AppViewport.
 * TopAppBar stays outside; content owns scroll rhythm and bottom padding.
 */
export function Page({
  topBar,
  children,
  className,
  contentClassName,
  testId,
}: PageProps) {
  return (
    <div
      className={cn("flex min-h-full flex-col", className)}
      data-testid={testId}
    >
      {topBar}
      <main
        className={cn(
          "flex flex-1 flex-col gap-(--space-5)",
          "px-(--space-4) pb-(--space-6) pt-(--space-4)",
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
