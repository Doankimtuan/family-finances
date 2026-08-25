"use client";

import { Modal } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

type ModalRootProps = ComponentProps<typeof Modal>;

/**
 * Design System Dialog → HeroUI Modal.
 * Keep overlays visually constrained to AppViewport.
 *
 * HeroUI requires Container nested inside Backdrop (not siblings),
 * otherwise the panel portals as a static flex child under the chrome
 * and sits above the bottom nav instead of overlaying it.
 */
export function Dialog({ children, ...props }: ModalRootProps) {
  return <Modal {...props}>{children}</Modal>;
}

export function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Modal.Backdrop>
      <Modal.Container
        placement="center"
        className={cn("max-w-[min(100%,400px)]", className)}
      >
        <Modal.Dialog
          className={cn(
            "rounded-(--radius-overlay) bg-surface-elevated",
            "border border-border-subtle shadow-[var(--elevation-2)]",
          )}
        >
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

Dialog.Trigger = Modal.Trigger;
Dialog.Backdrop = Modal.Backdrop;
Dialog.Container = Modal.Container;
Dialog.Dialog = Modal.Dialog;
Dialog.Header = Modal.Header;
Dialog.Heading = Modal.Heading;
Dialog.Body = Modal.Body;
Dialog.Footer = Modal.Footer;
Dialog.CloseTrigger = Modal.CloseTrigger;
