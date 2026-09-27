"use client";

import { Modal } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";
import { Button, ButtonVariant } from "@/shared/ui/button";

export const DialogVariant = {
  CONFIRMATION: "confirmation",
  DESTRUCTIVE: "destructive",
  INFO: "info",
} as const;

export type DialogVariant = (typeof DialogVariant)[keyof typeof DialogVariant];

type ModalRootProps = ComponentProps<typeof Modal>;

export type DialogProps = ModalRootProps;

/**
 * ViNha Canonical Dialog — HeroUI Modal wrapper.
 * Constrained to AppViewport (440px) with centered placement.
 */
export function Dialog({ children, ...props }: DialogProps) {
  return <Modal {...props}>{children}</Modal>;
}

export type DialogContentProps = {
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
  containerClassName?: string;
  surfaceClassName?: string;
  variant?: DialogVariant;
  isDismissable?: boolean;
  /** Test identifier for automated testing */
  testId?: string;
};

/**
 * Dialog surface container:
 * - Scrim: backdrop-filter blur(2px), tokenized scrim color
 * - Surface: max-w-[360px], 16px radius (--radius-overlay), elevated background
 * - 1px hairline border, high elevation shadow
 */
export function DialogContent({
  children,
  className,
  backdropClassName,
  containerClassName,
  surfaceClassName,
  variant = DialogVariant.CONFIRMATION,
  isDismissable = true,
  testId,
}: DialogContentProps) {
  const isDestructive = variant === DialogVariant.DESTRUCTIVE;
  const effectiveDismissable = isDestructive ? false : isDismissable;

  return (
    <Modal.Backdrop
      isDismissable={effectiveDismissable}
      className={cn(
        "fixed inset-0 z-(--z-scrim) flex items-center justify-center p-4",
        "bg-scrim backdrop-blur-xs transition-opacity duration-(--duration-normal)",
        backdropClassName,
      )}
    >
      <Modal.Container
        placement="center"
        className={cn(
          "w-full max-w-[min(calc(100vw-32px),360px)]",
          containerClassName,
        )}
      >
        <Modal.Dialog
          role={isDestructive ? "alertdialog" : "dialog"}
          data-testid={testId}
          className={cn(
            "w-full rounded-(--radius-overlay) bg-surface-elevated p-(--space-4)",
            "border border-border-subtle shadow-[var(--elevation-2)]",
            "flex flex-col gap-(--space-3)",
            "max-h-[min(85dvh,540px)] overflow-hidden",
            "outline-none focus:outline-none",
            surfaceClassName,
            className,
          )}
        >
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export type ConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  testId?: string;
};

/**
 * Pre-composed, accessible confirmation dialog for high-stakes and destructive actions.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  variant = DialogVariant.CONFIRMATION,
  confirmLabel,
  cancelLabel,
  isConfirmLoading = false,
  isConfirmDisabled = false,
  onConfirm,
  onCancel,
  testId,
}: ConfirmDialogProps) {
  const tButtons = useTranslations("buttons");
  const isDestructive = variant === DialogVariant.DESTRUCTIVE;

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        variant={variant}
        isDismissable={!isDestructive && !isConfirmLoading}
        testId={testId}
      >
        <Modal.Header className="flex flex-col gap-1 p-0">
          <Modal.Heading className="text-lg font-semibold text-text-primary">
            {title}
          </Modal.Heading>
          {description ? (
            <p className="text-sm leading-relaxed text-text-secondary">
              {description}
            </p>
          ) : null}
        </Modal.Header>

        {children ? (
          <Modal.Body className="min-h-0 flex-1 overflow-y-auto px-0 py-(--space-2)">
            {children}
          </Modal.Body>
        ) : null}

        <Modal.Footer className="flex items-center justify-end gap-(--space-2) pt-(--space-2) p-0">
          <Button
            variant={ButtonVariant.OUTLINED}
            isDisabled={isConfirmLoading}
            onPress={handleCancel}
          >
            {cancelLabel ?? tButtons("cancel")}
          </Button>
          <Button
            variant={
              isDestructive ? ButtonVariant.DESTRUCTIVE : ButtonVariant.PRIMARY
            }
            isLoading={isConfirmLoading}
            isDisabled={isConfirmDisabled}
            onPress={handleConfirm}
          >
            {confirmLabel ?? tButtons("confirm")}
          </Button>
        </Modal.Footer>
      </DialogContent>
    </Dialog>
  );
}

// Low-level slot composition
Dialog.Trigger = Modal.Trigger;
Dialog.Backdrop = Modal.Backdrop;
Dialog.Container = Modal.Container;
Dialog.Dialog = Modal.Dialog;
Dialog.Header = Modal.Header;
Dialog.Heading = Modal.Heading;
Dialog.Body = Modal.Body;
Dialog.Footer = Modal.Footer;
Dialog.CloseTrigger = Modal.CloseTrigger;
