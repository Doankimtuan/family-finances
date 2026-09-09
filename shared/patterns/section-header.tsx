"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

export type SectionHeaderProps = {
  title?: ReactNode;
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
        {title == null ? null : typeof title === "string" ? (
          <Heading
            level={2}
            className="text-sm font-semibold tracking-tight text-text-primary"
            data-slot="section-title"
          >
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
      {action ? (
        <div className="shrink-0 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:rounded-[var(--radius-control)] [&_a]:px-(--space-2) [&_a]:text-sm [&_a]:font-semibold [&_a]:text-accent [&_a]:transition-colors [&_a]:hover:bg-surface-hover [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-focus-ring [&_button]:min-h-11">
          {action}
        </div>
      ) : null}
    </div>
  );
}
