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

const SECTION_ACTION_CLASS =
  "-my-3 flex min-h-11 shrink-0 items-center [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:rounded-[var(--radius-control)] [&_a]:px-(--space-2) [&_a]:text-sm [&_a]:font-semibold [&_a]:text-accent [&_a]:transition-colors [&_a]:hover:bg-surface-hover [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-focus-ring [&_button]:min-h-11";

function renderTitle(title: ReactNode) {
  if (title == null) return null;
  if (typeof title === "string") {
    return (
      <Heading
        level={2}
        className="text-sm font-semibold tracking-tight text-text-primary"
        data-slot="section-title"
      >
        {title}
      </Heading>
    );
  }
  return title;
}

function renderDescription(description: ReactNode) {
  if (!description) return null;
  if (typeof description === "string") {
    return (
      <Text tone="secondary" size="sm" className="text-pretty leading-relaxed">
        {description}
      </Text>
    );
  }
  return description;
}

/**
 * Section title + optional description/action (Design System composite).
 * Title and action share one optically aligned row; description sits below.
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  const titleNode = renderTitle(title);
  const descriptionNode = renderDescription(description);

  if (!titleNode && !descriptionNode && !action) return null;

  return (
    <div className={cn("flex flex-col gap-(--space-1)", className)}>
      {titleNode || action ? (
        <div
          className="flex items-start justify-between gap-(--space-3)"
          data-slot="section-heading"
        >
          <div className="min-w-0 flex-1">{titleNode}</div>
          {action ? <div className={SECTION_ACTION_CLASS}>{action}</div> : null}
        </div>
      ) : null}
      {descriptionNode}
    </div>
  );
}
