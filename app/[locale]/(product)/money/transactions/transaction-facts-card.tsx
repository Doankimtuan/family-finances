import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Text } from "@/shared/ui/text";

type FactsCardProps = {
  title?: string;
  testId?: string;
  children: ReactNode;
};

type FactRowProps = {
  label: string;
  value: ReactNode;
};

/**
 * Grouped definition list for transaction detail. Presentation only: callers
 * still own which facts exist and how values are formatted.
 */
export function TransactionFactsCard({
  title,
  testId,
  children,
}: FactsCardProps) {
  return (
    <section className="flex flex-col gap-(--space-3)" data-testid={testId}>
      {title ? <SectionHeader title={title} /> : null}
      <Card tone="elevated" className="gap-0 p-0">
        <dl className="divide-y divide-border-subtle/65">{children}</dl>
      </Card>
    </section>
  );
}

export function TransactionFactRow({ label, value }: FactRowProps) {
  return (
    <div className="flex justify-between gap-(--space-3) px-(--space-4) py-(--space-3)">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <div className="min-w-0 text-right text-sm font-medium text-text-primary">
        {value}
      </div>
    </div>
  );
}
