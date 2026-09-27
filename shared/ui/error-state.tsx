"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Alert02Icon } from "@/shared/ui/stitch-icon-compat";
import { cn } from "@/shared/utils/cn";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Button, ButtonVariant } from "@/shared/ui/button";

export const ErrorStateVariant = {
  PLAIN: "plain",
  SECTION: "section",
  PAGE: "page",
} as const;

export type ErrorStateVariant =
  (typeof ErrorStateVariant)[keyof typeof ErrorStateVariant];

export type ErrorStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: ErrorStateVariant;
  className?: string;
  testId?: string;
};

/**
 * ViNha Canonical ErrorState.
 * Presentational error state with safe user-facing copy and retry affordance.
 * Never exposes raw HTTP/Supabase exception traces.
 */
export function ErrorState({
  title,
  description,
  action,
  onRetry,
  retryLabel,
  variant = ErrorStateVariant.PLAIN,
  className,
  testId,
}: ErrorStateProps) {
  const tButtons = useTranslations("buttons");
  const isPage = variant === ErrorStateVariant.PAGE;
  const isSection = variant === ErrorStateVariant.SECTION;

  const retryButton = onRetry ? (
    <Button
      variant={ButtonVariant.OUTLINED}
      onPress={onRetry}
      className="w-full max-w-[12rem]"
    >
      {retryLabel ?? tButtons("retry")}
    </Button>
  ) : null;

  return (
    <div
      role="alert"
      data-testid={testId}
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center gap-(--space-3) text-center",
        isPage
          ? "min-h-[50vh] px-(--space-5) py-(--space-8)"
          : isSection
            ? "rounded-(--radius-card) border border-border-subtle bg-surface-muted/40 px-(--space-4) py-(--space-6)"
            : "px-(--space-5) py-(--space-6)",
        className,
      )}
    >
      <div
        className={cn(
          "mb-(--space-1) flex size-12 items-center justify-center",
          "rounded-(--radius-control) bg-danger/10 text-danger",
        )}
        aria-hidden
      >
        <AppIcon icon={Alert02Icon} size={AppIconSize.DISPLAY} />
      </div>

      <Heading
        level={3}
        className="text-lg font-semibold text-text-primary"
        data-slot="error-state-title"
      >
        {title}
      </Heading>

      {description ? (
        <Text
          tone="secondary"
          size="sm"
          className="max-w-[22rem] leading-relaxed"
        >
          {description}
        </Text>
      ) : null}

      {action || retryButton ? (
        <div className="mt-(--space-2) flex items-center justify-center w-full max-w-[18rem]">
          {action ?? retryButton}
        </div>
      ) : null}
    </div>
  );
}
