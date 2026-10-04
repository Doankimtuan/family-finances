"use client";

import { Drawer } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type BottomSheetProps = ComponentProps<typeof Drawer>;

/**
 * ViNha Canonical Bottom Sheet — HeroUI Drawer (bottom placement).
 * Primary container for mobile sub-flows, creation forms, and selection lists.
 */
export function BottomSheet({ children, ...props }: BottomSheetProps) {
  return <Drawer {...props}>{children}</Drawer>;
}

export type BottomSheetContentProps = {
  children: ReactNode;
  className?: string;
  hasHandle?: boolean;
  testId?: string;
};

/**
 * Canonical mobile bottom sheet surface:
 * - Anchored to bottom of 440px viewport canvas
 * - Top corner radius: 16px (--radius-overlay)
 * - Elevated surface with 1px hairline top border
 * - Centered 36×4px drag handle
 * - Z-index: --z-modal-sheet (60)
 */
export function BottomSheetContent({
  children,
  className,
  hasHandle = true,
  testId,
}: BottomSheetContentProps) {
  return (
    <Drawer.Backdrop
      className={cn(
        "fixed inset-0 z-(--z-scrim) flex items-end justify-center",
        "bg-scrim backdrop-blur-xs transition-opacity duration-(--duration-normal)",
      )}
    >
      <Drawer.Content placement="bottom" className="h-dvh justify-center">
        <Drawer.Dialog
          data-testid={testId}
          className={cn(
            "vinha-sheet-dialog w-full max-w-(--app-viewport-max) rounded-t-(--radius-overlay) bg-surface-elevated",
            "border-t border-border-subtle shadow-[var(--elevation-2)]",
            "flex max-h-[min(90dvh,720px)] min-h-0 flex-col overflow-hidden",
            "[backface-visibility:hidden] [contain:layout_paint]",
            "[--drawer-enter-duration:var(--duration-normal)] [--drawer-exit-duration:var(--duration-fast)]",
            "[--drawer-enter-ease:var(--ease-standard)] [--drawer-exit-ease:var(--ease-standard)]",
            "motion-reduce:[will-change:auto]",
            className,
          )}
        >
          {hasHandle ? <Drawer.Handle /> : null}
          {children}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

// Low-level slot composition
BottomSheet.Trigger = Drawer.Trigger;
BottomSheet.Backdrop = Drawer.Backdrop;
BottomSheet.Content = Drawer.Content;
BottomSheet.Dialog = Drawer.Dialog;
BottomSheet.Header = Drawer.Header;
BottomSheet.Heading = Drawer.Heading;
BottomSheet.Body = Drawer.Body;
BottomSheet.Footer = Drawer.Footer;
BottomSheet.CloseTrigger = Drawer.CloseTrigger;
BottomSheet.Handle = Drawer.Handle;
