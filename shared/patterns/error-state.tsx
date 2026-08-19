"use client";

import type { ReactNode } from "react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/utils/cn";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";

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
      className={cn(
        "flex flex-col items-center justify-center gap-(--space-3) px-(--space-6) py-(--space-10) text-center",
        className,
      )}
    >
      <AppIcon icon={Alert02Icon} size="xl" className="text-danger" />
      <Heading level={3}>{title}</Heading>
      {description ? (
        <Text
          tone="secondary"
          size="sm"
          className="max-w-[20rem] leading-relaxed"
        >
          {description}
        </Text>
      ) : null}
      {action}
    </div>
  );
}
