import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { InboxSectionTitle } from "./inbox-section-title";

type InboxFactsCardProps = {
  title?: string;
  testId?: string;
  footer?: ReactNode;
  children: ReactNode;
};

type InboxFactRowProps = {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  className?: string;
  testId?: string;
};

/**
 * Grouped definition list for Inbox detail. Presentation only: callers still
 * own which facts exist and how values are formatted.
 */
export function InboxFactsCard({
  title,
  testId,
  footer,
  children,
}: InboxFactsCardProps) {
  return (
    <section className="flex flex-col gap-(--space-3)" data-testid={testId}>
      {title ? <InboxSectionTitle>{title}</InboxSectionTitle> : null}
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <dl className="divide-y divide-border-subtle/65">{children}</dl>
        {footer}
      </Card>
    </section>
  );
}

export function InboxFactRow({
  label,
  value,
  emphasis = false,
  className,
  testId,
}: InboxFactRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-(--space-3) px-(--space-4) py-(--space-3)",
        className,
      )}
      data-testid={testId}
    >
      <Text
        as="dt"
        size="sm"
        tone={emphasis ? "primary" : "secondary"}
        weight={emphasis ? "semibold" : undefined}
        className="text-pretty"
      >
        {label}
      </Text>
      <dd
        className={cn(
          "min-w-0 text-right text-sm text-text-primary",
          emphasis ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
