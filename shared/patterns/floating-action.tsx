import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type FloatingActionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Sticky quick-action zone for repeated high-frequency actions (e.g. Add
 * Transaction). The action is fixed above the bottom navigation from the
 * first visible Home frame, so a frequent capture task never depends on page
 * scroll. The zone itself is pointer-transparent so only the action control
 * inside it intercepts touches. Prefer `BottomActionBar` for form/confirm
 * submits.
 */
export function FloatingAction({ children, className }: FloatingActionProps) {
  return (
    <div
      data-slot="floating-action"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-navigation-height)+var(--space-4))] z-(--z-sticky)",
        "flex justify-center px-(--page-gutter)",
        className,
      )}
    >
      <div className="flex w-full max-w-[var(--app-viewport-max)] justify-end pe-(--space-1)">
        {children}
      </div>
    </div>
  );
}
