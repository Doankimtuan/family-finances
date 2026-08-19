"use client";

import type { ReactNode } from "react";
import { EmptyState as HeroEmptyState } from "@heroui/react";
import { InboxIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <HeroEmptyState
      className={cn(
        "flex flex-col items-center justify-center gap-(--space-3) px-(--space-5) py-(--space-6) text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-(--space-1) flex size-12 items-center justify-center",
          "rounded-(--radius-control) bg-primary-soft",
          "text-primary",
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
