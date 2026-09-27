"use client";

import type { ReactNode } from "react";
import { EmptyState as HeroEmptyState } from "@heroui/react";
import {
  InboxIcon,
  CheckmarkCircle02Icon,
  Search01Icon,
  Shield01Icon,
} from "@/shared/ui/stitch-icon-compat";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";

export const EmptyStateVariant = {
  GENERAL: "general",
  PENDING_CLEAR: "pending-clear",
  ZERO_DEBT: "zero-debt",
  NO_RESULTS: "no-results",
} as const;

export type EmptyStateVariant =
  (typeof EmptyStateVariant)[keyof typeof EmptyStateVariant];

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
  testId?: string;
};

/**
 * ViNha Canonical EmptyState.
 * Communicates calm, clarity, and reassurance rather than framing absence as failure.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  variant = EmptyStateVariant.GENERAL,
  className,
  testId,
}: EmptyStateProps) {
  // Variant defaults for iconic containers and tones
  let iconContent = icon;
  let iconContainerClass = "bg-primary-soft text-primary";

  if (!iconContent) {
    switch (variant) {
      case EmptyStateVariant.PENDING_CLEAR:
        iconContent = (
          <AppIcon icon={CheckmarkCircle02Icon} size={AppIconSize.DISPLAY} />
        );
        iconContainerClass = "bg-income-soft text-income";
        break;
      case EmptyStateVariant.ZERO_DEBT:
        iconContent = (
          <AppIcon icon={Shield01Icon} size={AppIconSize.DISPLAY} />
        );
        iconContainerClass = "bg-income-soft text-income";
        break;
      case EmptyStateVariant.NO_RESULTS:
        iconContent = (
          <AppIcon icon={Search01Icon} size={AppIconSize.DISPLAY} />
        );
        iconContainerClass = "bg-surface-muted text-text-muted";
        break;
      default:
        iconContent = <AppIcon icon={InboxIcon} size={AppIconSize.DISPLAY} />;
        iconContainerClass = "bg-primary-soft text-primary";
        break;
    }
  }

  return (
    <HeroEmptyState
      data-testid={testId}
      className={cn(
        "flex flex-col items-center justify-center gap-(--space-3) px-(--space-5) py-(--space-6) text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-(--space-1) flex size-14 items-center justify-center rounded-full transition-transform",
          iconContainerClass,
        )}
        aria-hidden
      >
        {iconContent}
      </div>

      <Heading
        level={3}
        className="text-lg font-semibold text-text-primary"
        data-slot="empty-state-title"
      >
        {title}
      </Heading>

      {description ? (
        <Text tone="muted" size="sm" className="max-w-[20rem] leading-relaxed">
          {description}
        </Text>
      ) : null}

      {action ? (
        <div className="mt-(--space-2) flex items-center justify-center w-full max-w-[18rem]">
          {action}
        </div>
      ) : null}
    </HeroEmptyState>
  );
}
