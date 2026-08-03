"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

export type SystemShellProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Full-viewport system message shell (error / offline / permission / maintenance).
 * No five-tab chrome — pair with ChromeShell chrome="system".
 */
export function SystemShell({
  title,
  description,
  icon,
  actions,
  className,
  "data-testid": testId,
}: SystemShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-full flex-col items-center justify-center gap-(--space-4) px-(--space-6) py-(--space-10) text-center",
        className,
      )}
      data-testid={testId ?? "system-shell"}
    >
      {icon ?? <BrandMark variant="soft" size="md" />}
      <Heading level={1} className="text-xl tracking-tight">
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
      {actions ? (
        <div className="flex w-full max-w-[20rem] flex-col gap-(--space-3)">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
