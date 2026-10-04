"use client";

import type { ReactNode } from "react";
import { Heading } from "@/shared/ui/heading";

type Props = {
  date: string;
  label: string;
  children: ReactNode;
  countLabel?: string;
  summary?: ReactNode;
};

/**
 * One calendar-day group on the transactions list. Date stays on the canvas;
 * events share one surface so financial activity is easy to scan.
 */
export function TransactionsDateGroup({
  date,
  label,
  children,
  countLabel,
  summary,
}: Props) {
  const headingId = `transactions-date-${date}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-(--space-2)"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-(--space-2)">
        <div className="flex items-center gap-(--space-2)">
          <Heading
            id={headingId}
            level={2}
            className="px-(--space-1) text-sm font-semibold text-text-primary"
          >
            {label}
          </Heading>
          {countLabel ? (
            <span className="rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-2) py-(--space-1) text-xs text-text-secondary">
              {countLabel}
            </span>
          ) : null}
        </div>
        {summary}
      </div>
      <ul className="overflow-hidden rounded-(--radius-card) border border-border-subtle bg-surface shadow-xs divide-y divide-border-subtle/70">
        {children}
      </ul>
    </section>
  );
}
