import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { LoanSectionTitle } from "./loan-section-title";

type LoanFactsCardProps = {
  title?: string;
  testId?: string;
  footer?: ReactNode;
  children: ReactNode;
};

type LoanFactRowProps = {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  className?: string;
  testId?: string;
};

/**
 * Grouped definition list for Loans. Presentation only: callers still own
 * which facts exist and how values are formatted.
 */
export function LoanFactsCard({
  title,
  testId,
  footer,
  children,
}: LoanFactsCardProps) {
  return (
    <section className="flex flex-col gap-(--space-2)" data-testid={testId}>
      {title ? <LoanSectionTitle>{title}</LoanSectionTitle> : null}
      <Card tone="elevated" className="gap-0 overflow-hidden p-0">
        <dl className="divide-y divide-divider">{children}</dl>
        {footer}
      </Card>
    </section>
  );
}

export function LoanFactRow({
  label,
  value,
  emphasis = false,
  className,
  testId,
}: LoanFactRowProps) {
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
          "min-w-0 text-right text-sm tabular-nums text-text-primary",
          emphasis ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function LoanFactNote({ children }: { children: ReactNode }) {
  return (
    <div className="px-(--space-4) py-(--space-3)">
      <Text size="sm" tone="secondary" className="text-pretty">
        {children}
      </Text>
    </div>
  );
}
