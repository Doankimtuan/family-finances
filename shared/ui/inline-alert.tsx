"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import {
  InformationCircleIcon,
  Alert02Icon,
  CheckmarkCircle02Icon,
} from "@/shared/ui/stitch-icon-compat";

export const InlineAlertVariant = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  SUCCESS: "success",
} as const;

export type InlineAlertVariant =
  (typeof InlineAlertVariant)[keyof typeof InlineAlertVariant];

export type InlineAlertProps = {
  variant?: InlineAlertVariant;
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
  [InlineAlertVariant.INFO]: InformationCircleIcon,
  [InlineAlertVariant.WARNING]: Alert02Icon,
  [InlineAlertVariant.ERROR]: Alert02Icon,
  [InlineAlertVariant.SUCCESS]: CheckmarkCircle02Icon,
};

const VARIANT_STYLES: Record<
  InlineAlertVariant,
  { container: string; title: string; body: string }
> = {
  [InlineAlertVariant.INFO]: {
    container:
      "bg-transfer-soft/80 border-transfer/20 text-transfer dark:bg-[#082F49] dark:border-[#0284C7]/30 dark:text-[#38BDF8]",
    title: "text-transfer dark:text-[#38BDF8]",
    body: "text-text-secondary dark:text-zinc-300",
  },
  [InlineAlertVariant.WARNING]: {
    container:
      "bg-warning-soft/80 border-warning/20 text-warning dark:bg-[#451A03] dark:border-[#D97706]/30 dark:text-[#FBBF24]",
    title: "text-warning dark:text-[#FBBF24]",
    body: "text-text-secondary dark:text-zinc-300",
  },
  [InlineAlertVariant.ERROR]: {
    container:
      "bg-danger-soft/80 border-danger/20 text-danger dark:bg-[#4C0519] dark:border-[#E11D48]/30 dark:text-[#FB7185]",
    title: "text-danger dark:text-[#FB7185]",
    body: "text-text-secondary dark:text-zinc-300",
  },
  [InlineAlertVariant.SUCCESS]: {
    container:
      "bg-income-soft/80 border-income/20 text-income dark:bg-[#064E3B] dark:border-[#059669]/30 dark:text-[#34D399]",
    title: "text-income dark:text-[#34D399]",
    body: "text-text-secondary dark:text-zinc-300",
  },
};

/**
 * Canonical InlineAlert — persistent in-page contextual guidance or policy guardrail.
 * Radius: 10px (--radius-control)
 * Padding: 12px vertical, 14px horizontal
 * Role: alert (error/warning) or status (info/success)
 */
export function InlineAlert({
  variant = InlineAlertVariant.INFO,
  title,
  children,
  description,
  icon,
  action,
  onDismiss,
  className,
  testId,
}: InlineAlertProps) {
  const isHighUrgency =
    variant === InlineAlertVariant.ERROR ||
    variant === InlineAlertVariant.WARNING;
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
          aria-label="Đóng thông báo"
          className="size-5 shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
