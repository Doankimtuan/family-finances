"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import {
  TransactionRow,
  type TransactionAmountTone,
} from "@/shared/patterns/transaction-row";

export function TransactionListItem({
  href,
  activityId,
  title,
  subtitle,
  amountLabel,
  amountMeta,
  amountAria,
  tone,
  leading,
}: {
  href: string;
  activityId: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  amountMeta: string;
  amountAria: string;
  tone: TransactionAmountTone;
  leading: ReactNode;
}) {
  const { isHidden } = useFinancialPrivacy();
  const accessibleName = isHidden
    ? [title, subtitle].filter(Boolean).join(". ")
    : [title, amountAria, subtitle].filter(Boolean).join(". ");

  return (
    <li>
      <Link
        href={href}
        className="block min-h-11 rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
        aria-label={accessibleName}
        data-testid={`transaction-row-${activityId}`}
      >
        <TransactionRow
          leading={leading}
          title={title}
          subtitle={subtitle}
          amountLabel={amountLabel}
          amountMeta={amountMeta || undefined}
          tone={tone}
          showRail={false}
          showChevron
          className="border-b-0 px-(--space-4)"
        />
      </Link>
    </li>
  );
}
