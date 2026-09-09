import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type BottomActionBarProps = {
  children: ReactNode;
  className?: string;
  layout?: BottomActionBarLayout;
};

export const BottomActionBarLayout = {
  STACKED: "stacked",
  SPLIT: "split",
} as const;

export type BottomActionBarLayout =
  (typeof BottomActionBarLayout)[keyof typeof BottomActionBarLayout];

/**
 * Sticky mobile action zone for long forms and confirmations.
 * Keep to one primary action plus one secondary escape.
 * Bottom navigation already owns the home-indicator inset; this bar keeps a
 * token gap so actions do not sit on the tab row.
 */
export function BottomActionBar({
  children,
  className,
  layout = BottomActionBarLayout.STACKED,
}: BottomActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-(--z-sticky) -mx-(--page-gutter)",
        "isolate mt-(--space-2) border-t border-divider",
        "bg-canvas/95 px-(--page-gutter) pt-(--space-3) pb-(--space-4) backdrop-blur-md",
        "shadow-(--elevation-1)",
        className,
      )}
    >
      <div
        data-slot="bottom-action-bar"
        className={cn(
          "flex gap-(--space-2)",
          layout === BottomActionBarLayout.SPLIT ? "items-stretch" : "flex-col",
        )}
      >
        {children}
      </div>
    </div>
  );
}
