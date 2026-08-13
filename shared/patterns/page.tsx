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
 * The shell owns scrolling and bottom-navigation clearance; pages own gutters.
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
      data-slot="page"
      data-testid={testId}
    >
      {topBar}
      <div
        className={cn(
          "flex flex-1 flex-col gap-(--space-4)",
          "px-(--page-gutter) pb-(--space-5) pt-(--space-3)",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
