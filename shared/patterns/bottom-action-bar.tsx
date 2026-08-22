import type { ReactNode } from "react";
import { SafeArea } from "@/providers/safe-area";
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
 */
export function BottomActionBar({
  children,
  className,
  layout = BottomActionBarLayout.STACKED,
}: BottomActionBarProps) {
  return (
    <SafeArea
      edges={["bottom"]}
      className={cn(
        "sticky bottom-0 z-(--z-sticky) -mx-(--space-4)",
        "relative isolate mt-(--space-2) border-t border-divider",
        "bg-canvas/95 px-(--space-4) pt-(--space-3) backdrop-blur-md",
        "shadow-[0_-8px_18px_-12px_rgba(0,0,0,0.45)] before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-gradient-to-t before:from-canvas/95 before:to-transparent before:content-[''] dark:shadow-[0_-8px_20px_-12px_rgba(255,255,255,0.24)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex gap-(--space-2)",
          layout === BottomActionBarLayout.SPLIT ? "items-stretch" : "flex-col",
        )}
      >
        {children}
      </div>
    </SafeArea>
  );
}
