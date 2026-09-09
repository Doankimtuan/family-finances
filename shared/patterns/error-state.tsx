"use client";

import type { ReactNode } from "react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/utils/cn";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";

/**
 * Presentational error state. Callers provide localized `title` / `description`.
 */
export function ErrorState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center gap-(--space-3) px-(--space-5) py-(--space-6) text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-(--space-1) flex size-12 items-center justify-center",
          "rounded-(--radius-control) bg-danger/10",
          "text-danger",
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
          className="max-w-[20rem] leading-relaxed"
        >
          {description}
        </Text>
      ) : null}
      {action ? (
        <div className="mt-(--space-2) w-full max-w-[18rem]">{action}</div>
      ) : null}
    </div>
  );
}
