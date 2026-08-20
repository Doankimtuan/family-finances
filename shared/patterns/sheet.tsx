"use client";

import { Drawer } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

type DrawerRootProps = ComponentProps<typeof Drawer>;

/**
 * Design System Sheet → HeroUI Drawer (bottom placement).
 * Nest Content inside Backdrop so the overlay owns the panel tree.
 */
export function Sheet({ children, ...props }: DrawerRootProps) {
  return <Drawer {...props}>{children}</Drawer>;
}

export function SheetContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Drawer.Backdrop>
      <Drawer.Content placement="bottom" className="h-dvh">
        <Drawer.Dialog
          className={cn(
            "bg-surface-elevated",
            "border-t border-border-subtle shadow-[var(--elevation-2)]",
            "flex max-h-[min(90dvh,720px)] min-h-0 flex-col overflow-hidden [backface-visibility:hidden] [contain:layout_paint]",
            "[--drawer-enter-duration:var(--duration-normal)] [--drawer-exit-duration:var(--duration-fast)]",
            "[--drawer-enter-ease:var(--ease-standard)] [--drawer-exit-ease:var(--ease-standard)]",
            "motion-reduce:[will-change:auto]",
            className,
          )}
        >
          <Drawer.Handle />
          {children}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

Sheet.Trigger = Drawer.Trigger;
Sheet.Backdrop = Drawer.Backdrop;
Sheet.Content = Drawer.Content;
Sheet.Dialog = Drawer.Dialog;
Sheet.Header = Drawer.Header;
Sheet.Heading = Drawer.Heading;
Sheet.Body = Drawer.Body;
Sheet.Footer = Drawer.Footer;
Sheet.CloseTrigger = Drawer.CloseTrigger;
