import type { ReactNode } from "react";
import { SafeArea } from "@/providers/safe-area";
import { cn } from "@/shared/utils/cn";

export type BottomActionBarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Sticky mobile action zone for long forms and confirmations.
 * Keep to one primary action plus one secondary escape.
 */
export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <SafeArea
      edges={["bottom"]}
      className={cn(
        "sticky bottom-0 z-(--z-sticky) -mx-(--space-4)",
        "mt-(--space-2) border-t border-border-subtle/70",
        "bg-canvas/95 px-(--space-4) pt-(--space-3) backdrop-blur-md",
        className,
      )}
    >
      <div className="flex flex-col gap-(--space-2)">{children}</div>
    </SafeArea>
  );
}
