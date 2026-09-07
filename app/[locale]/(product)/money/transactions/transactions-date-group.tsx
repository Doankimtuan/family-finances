import type { ReactNode } from "react";
import { Card } from "@/shared/patterns/card";
import { Heading } from "@/shared/ui/heading";

type Props = {
  date: string;
  label: string;
  children: ReactNode;
};

/**
 * One calendar-day group on the transactions list. Date stays on the canvas;
 * events sit in a single elevated card so the scan matches Money hub modules.
 */
export function TransactionsDateGroup({ date, label, children }: Props) {
  const headingId = `transactions-date-${date}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-(--space-2)"
    >
      <Heading
        id={headingId}
        level={2}
        className="px-(--space-1) text-sm font-medium text-text-secondary"
      >
        {label}
      </Heading>
      <Card tone="elevated" className="gap-0 p-0">
        <ul className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          {children}
        </ul>
      </Card>
    </section>
  );
}
