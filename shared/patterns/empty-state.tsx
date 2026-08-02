"use client";

import type { ReactNode } from "react";
import { EmptyState as HeroEmptyState } from "@heroui/react";
import { Tray } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";

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
        "flex flex-col items-center justify-center gap-(--space-3) px-(--space-6) py-(--space-8) text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-(--space-1) flex size-14 items-center justify-center",
          "rounded-[var(--radius-xl)] bg-surface",
          "border border-border-subtle shadow-[var(--elevation-1)]",
          "text-text-muted",
        )}
        aria-hidden
      >
        {icon ?? <Tray size={28} weight="duotone" />}
      </div>
      <Heading level={3} className="text-lg font-semibold text-text-primary">
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
