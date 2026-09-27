"use client";

import type { ReactNode } from "react";
import { EmptyState as HeroEmptyState } from "@heroui/react";
import { InboxIcon } from "@/shared/ui/stitch-icon-compat";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";

export type EmptyStateTone = "primary" | "positive" | "neutral";

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: EmptyStateTone;
  className?: string;
  testId?: string;
};

const TONE_CLASSES: Record<EmptyStateTone, string> = {
  primary: "bg-primary-soft text-primary",
  positive: "bg-income-soft text-income",
  neutral: "bg-surface-muted text-text-muted",
};

/** Presentational empty state. Callers own the message and semantic meaning. */
export function EmptyState({
  title,
  description,
  action,
  icon,
  tone = "primary",
  className,
  testId,
}: EmptyStateProps) {
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
          "mb-(--space-1) flex size-12 items-center justify-center rounded-(--radius-control)",
          TONE_CLASSES[tone],
        )}
        aria-hidden
      >
        {icon ?? <AppIcon icon={InboxIcon} size={AppIconSize.DISPLAY} />}
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
        <div className="mt-(--space-2) w-full max-w-[18rem]">{action}</div>
      ) : null}
    </HeroEmptyState>
  );
}
