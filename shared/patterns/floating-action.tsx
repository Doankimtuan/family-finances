import type { ReactNode } from "react";
import { Button, ButtonVariant, type ButtonProps } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";

export type FloatingActionProps = {
  children: ReactNode;
  className?: string;
};

const FLOATING_ACTION_CONTROL_CLASS_NAME = cn(
  "pointer-events-auto min-h-(--floating-action-size) shrink-0 gap-(--space-2)",
  "rounded-full px-(--space-4) shadow-(--elevation-2)",
);

/**
 * Sticky quick-action zone for repeated high-frequency actions (e.g. Add
 * Transaction). The action is fixed above the bottom navigation from the
 * first visible frame, so a frequent capture task never depends on page
 * scroll. The pattern reserves its own in-flow clearance so the trailing
 * content always scrolls clear of the pill; the fixed zone itself is
 * pointer-transparent so only the action control inside it intercepts
 * touches. Prefer `BottomActionBar` for form/confirm submits.
 */
export function FloatingAction({ children, className }: FloatingActionProps) {
  return (
    <>
      <div
        aria-hidden="true"
        data-slot="floating-action-clearance"
        className="h-(--floating-action-clearance) shrink-0"
      />
      <div
        data-slot="floating-action"
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-navigation-height)+var(--safe-area-bottom)+var(--floating-action-gap))] z-(--z-floating-action)",
          "flex justify-center px-(--page-gutter)",
          className,
        )}
      >
        <div className="flex w-full max-w-[var(--app-viewport-max)] justify-end pe-(--space-1)">
          {children}
        </div>
      </div>
    </>
  );
}

export type FloatingActionButtonProps = ButtonProps;

/**
 * Canonical pill control for `FloatingAction`. One high-frequency create
 * action per screen — never a second competing FAB.
 */
export function FloatingActionButton({
  className,
  children,
  variant = ButtonVariant.PRIMARY,
  ...props
}: FloatingActionButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(FLOATING_ACTION_CONTROL_CLASS_NAME, className)}
      {...props}
    >
      {children}
    </Button>
  );
}
