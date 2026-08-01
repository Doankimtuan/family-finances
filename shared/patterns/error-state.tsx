"use client";

import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
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
      <WarningCircle
        size={32}
        className="text-danger"
        weight="duotone"
        aria-hidden
      />
      <Heading level={3}>{title}</Heading>
      {description ? (
        <Text tone="secondary" size="sm">
          {description}
        </Text>
      ) : null}
      {action}
    </div>
  );
}
