import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { DebtSectionTitle } from "./debt-section-title";

type DebtFactsCardProps = {
  title?: string;
  testId?: string;
  footer?: ReactNode;
  children: ReactNode;
};

type DebtFactRowProps = {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  className?: string;
};

/**
 * Grouped definition list for Debt detail. Presentation only: callers still
 * own which facts exist and how values are formatted.
 */
export function DebtFactsCard({
  title,
  testId,
  footer,
  children,
}: DebtFactsCardProps) {
  return (
    <section className="flex flex-col gap-(--space-2)" data-testid={testId}>
      {title ? <DebtSectionTitle>{title}</DebtSectionTitle> : null}
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <dl className="divide-y divide-divider">{children}</dl>
        {footer}
      </Card>
    </section>
  );
}

export function DebtFactRow({
  label,
  value,
  emphasis = false,
  className,
}: DebtFactRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-(--space-3) px-(--space-4) py-(--space-3)",
        className,
      )}
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
          "min-w-0 text-right text-sm tabular-nums text-text-primary",
          emphasis ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
