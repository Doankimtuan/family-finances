"use client";

import type { ReactNode } from "react";
import { EmptyState as HeroEmptyState } from "@heroui/react";
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
        "flex flex-col items-center justify-center gap-(--space-3) px-(--space-6) py-(--space-10) text-center",
        className,
      )}
    >
      {icon}
      <Heading level={3} className="text-lg text-text-primary">
        {title}
      </Heading>
      {description ? (
        <Text tone="muted" size="sm" className="max-w-[16rem]">
          {description}
        </Text>
      ) : null}
      {action}
    </HeroEmptyState>
  );
}
