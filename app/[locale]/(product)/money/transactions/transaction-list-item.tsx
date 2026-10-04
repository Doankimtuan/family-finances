"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useFinancialPrivacy } from "@/providers/financial-privacy-provider";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import {
  TransactionRow,
  type TransactionAmountTone,
  type TransactionType,
} from "@/shared/patterns/transaction-row";

export function TransactionListItem({
  href,
  activityId,
  title,
  subtitle,
  subtitleContent,
  amountLabel,
  amountMeta,
  amountAria,
  tone,
  type,
  leading,
}: {
  href: string;
  activityId: string;
  title: string;
  subtitle: string;
  subtitleContent?: ReactNode;
  amountLabel: string;
  amountMeta: string;
  amountAria: string;
  tone: TransactionAmountTone;
  type?: TransactionType;
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
        prefetch={PRODUCT_LINK_PREFETCH}
        className="block min-h-11 transition-colors duration-(--duration-fast) hover:bg-surface-hover motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
        aria-label={accessibleName}
        data-testid={`transaction-row-${activityId}`}
      >
        <TransactionRow
          leading={leading}
          title={title}
          subtitle={subtitleContent ?? subtitle}
          amountLabel={amountLabel}
          amountMeta={amountMeta || undefined}
          tone={tone}
          type={type}
          showRail={false}
          className="border-b-0 px-(--space-1) py-(--space-1)"
        />
      </Link>
    </li>
  );
}
