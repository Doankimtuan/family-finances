"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

export type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Section title + optional description/action (Design System composite).
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-(--space-3)",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-(--space-1)">
        {typeof title === "string" ? (
          <Heading level={2} className="text-xl tracking-tight">
            {title}
          </Heading>
        ) : (
          title
        )}
        {description ? (
          typeof description === "string" ? (
            <Text tone="secondary" size="sm" className="leading-relaxed">
              {description}
            </Text>
          ) : (
            description
          )
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
