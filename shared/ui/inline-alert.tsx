"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { InlineAlertVariant as InlineAlertVariantValue } from "@/shared/ui/inline-alert-constants";
import type { InlineAlertVariant as InlineAlertVariantType } from "@/shared/ui/inline-alert-constants";
import {
  InformationCircleIcon,
  Alert02Icon,
  CheckmarkCircle02Icon,
} from "@/shared/ui/stitch-icon-compat";

export const InlineAlertVariant = InlineAlertVariantValue;
export type InlineAlertVariant = InlineAlertVariantType;

export type InlineAlertProps = {
  variant?: InlineAlertVariantType;
  title?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
};

const VARIANT_ICONS = {
  [InlineAlertVariantValue.INFO]: InformationCircleIcon,
  [InlineAlertVariantValue.WARNING]: Alert02Icon,
  [InlineAlertVariantValue.ERROR]: Alert02Icon,
  [InlineAlertVariantValue.SUCCESS]: CheckmarkCircle02Icon,
};

const VARIANT_STYLES: Record<
  InlineAlertVariantType,
  { container: string; title: string; body: string }
> = {
  [InlineAlertVariantValue.INFO]: {
    container: "bg-transfer-soft/80 border-transfer/20 text-transfer",
    title: "text-transfer",
    body: "text-text-secondary",
  },
  [InlineAlertVariantValue.WARNING]: {
    container: "bg-warning-soft/80 border-warning/20 text-warning",
    title: "text-warning",
    body: "text-text-secondary",
  },
  [InlineAlertVariantValue.ERROR]: {
    container: "bg-danger-soft/80 border-danger/20 text-danger",
    title: "text-danger",
    body: "text-text-secondary",
  },
  [InlineAlertVariantValue.SUCCESS]: {
    container: "bg-income-soft/80 border-income/20 text-income",
    title: "text-income",
    body: "text-text-secondary",
  },
};

/**
 * Canonical InlineAlert — persistent in-page contextual guidance or policy guardrail.
 * Radius: 10px (--radius-control)
 * Padding: 12px vertical, 14px horizontal
 * Role: alert (error/warning) or status (info/success)
 */
export function InlineAlert({
  variant = InlineAlertVariantValue.INFO,
  title,
  children,
  description,
  icon,
  action,
  onDismiss,
  className,
  testId,
}: InlineAlertProps) {
  const tA11y = useTranslations("a11y");
  const isHighUrgency =
    variant === InlineAlertVariantValue.ERROR ||
    variant === InlineAlertVariantValue.WARNING;
  const styles = VARIANT_STYLES[variant];
  const defaultIconArtwork = VARIANT_ICONS[variant];
  const bodyContent = children ?? description;

  return (
    <div
      role={isHighUrgency ? "alert" : "status"}
      data-testid={testId}
      className={cn(
        "flex w-full items-start gap-3 rounded-(--radius-control) border p-3 sm:px-3.5",
        styles.container,
        className,
      )}
    >
      <div
        className="flex size-5 shrink-0 items-center justify-center pt-0.5"
        aria-hidden
      >
        {icon ?? <AppIcon icon={defaultIconArtwork} size={AppIconSize.MD} />}
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        {title ? (
          <h4
            className={cn("text-sm font-semibold leading-snug", styles.title)}
          >
            {title}
          </h4>
        ) : null}
        {bodyContent ? (
          <div
            className={cn(
              "text-xs leading-relaxed sm:text-[13px]",
              styles.body,
            )}
          >
            {bodyContent}
          </div>
        ) : null}
        {action ? (
          <div className="mt-1.5 flex items-center gap-2">{action}</div>
        ) : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={tA11y("dismissAlert")}
          className="flex size-11 shrink-0 items-center justify-center text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
