import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export const StickyFormActionLayout = {
  STACKED: "stacked",
  SPLIT: "split",
} as const;

export type StickyFormActionLayout =
  (typeof StickyFormActionLayout)[keyof typeof StickyFormActionLayout];

export type StickyFormActionProps = {
  children?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  layout?: StickyFormActionLayout;
  className?: string;
  testId?: string;
};

/**
 * ViNha Canonical StickyFormAction.
 * Anchored to bottom of viewport with safe-area padding for mobile create/edit forms.
 * Prevents vertical layout shift and preserves touch target ergonomics.
 */
export function StickyFormAction({
  children,
  primaryAction,
  secondaryAction,
  layout = StickyFormActionLayout.SPLIT,
  className,
  testId,
}: StickyFormActionProps) {
  const isSplit = layout === StickyFormActionLayout.SPLIT;

  return (
    <div
      data-testid={testId}
      className={cn(
        "sticky bottom-0 z-(--z-sticky) -mx-(--page-gutter)",
        "isolate mt-(--space-4) border-t border-border-subtle",
        "bg-surface-elevated/95 px-(--page-gutter) pt-(--space-3) backdrop-blur-md",
        "pb-[calc(var(--space-3)+env(safe-area-inset-bottom,0px))]",
        "shadow-[var(--elevation-1)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full gap-(--space-2)",
          isSplit ? "flex-row items-center" : "flex-col",
        )}
      >
        {children ?? (
          <>
            {secondaryAction ? (
              <div className={cn(isSplit ? "flex-1" : "w-full order-2")}>
                {secondaryAction}
              </div>
            ) : null}
            {primaryAction ? (
              <div className={cn(isSplit ? "flex-1" : "w-full order-1")}>
                {primaryAction}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
