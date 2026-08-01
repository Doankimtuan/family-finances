"use client";

import { Modal } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

type ModalRootProps = ComponentProps<typeof Modal>;

/**
 * Design System Dialog → HeroUI Modal.
 * Keep overlays visually constrained to AppViewport.
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
    <>
      <Modal.Backdrop />
      <Modal.Container className={cn("max-w-[min(100%,400px)]", className)}>
        <Modal.Dialog>{children}</Modal.Dialog>
      </Modal.Container>
    </>
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
