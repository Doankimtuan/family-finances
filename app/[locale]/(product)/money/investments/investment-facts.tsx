import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { InvestmentSectionTitle } from "./investment-section-title";

type InvestmentFactsCardProps = {
  title?: string;
  testId?: string;
  children: ReactNode;
};

type InvestmentFactRowProps = {
  label: string;
  value: ReactNode;
};

/**
 * Grouped definition list for investment detail. Presentation only: callers
 * still own which facts exist and how values are formatted.
 */
export function InvestmentFactsCard({
  title,
  testId,
  children,
}: InvestmentFactsCardProps) {
  return (
    <section className="flex flex-col gap-(--space-3)" data-testid={testId}>
      {title ? <InvestmentSectionTitle>{title}</InvestmentSectionTitle> : null}
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <dl className="divide-y divide-divider">{children}</dl>
      </Card>
    </section>
  );
}

export function InvestmentFactRow({ label, value }: InvestmentFactRowProps) {
  return (
    <div className="flex items-start justify-between gap-(--space-3) px-(--space-4) py-(--space-3)">
      <Text size="sm" tone="secondary" className="text-pretty">
        {label}
      </Text>
      <div className="min-w-0 text-right text-sm font-medium text-text-primary">
        {value}
      </div>
    </div>
  );
}

export function InvestmentFactNote({ children }: { children: ReactNode }) {
  return (
    <div className="px-(--space-4) py-(--space-3)">
      <Text size="sm" tone="secondary" className="text-pretty">
        {children}
      </Text>
    </div>
  );
}
