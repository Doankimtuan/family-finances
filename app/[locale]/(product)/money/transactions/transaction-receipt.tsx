"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  TransactionFactRow,
  TransactionFactsCard,
} from "./transaction-facts-card";
import {
  RECEIPT_ACTION_LINK_CLASS,
  TRANSACTION_SURFACE_LINK_CLASS,
} from "./transaction-chrome";

type RelatedRecord = {
  id: string;
  label: string;
  href?: string;
};

type NextActionVariant = keyof typeof RECEIPT_ACTION_LINK_CLASS;

type NextAction = {
  id: string;
  label: string;
  href?: string;
  onPress?: () => void;
  variant?: NextActionVariant;
};

type ReceiptRow = {
  id: string;
  label: string;
  value: ReactNode;
  kind?: "text" | "financial";
  /** Unclassified legacy rows are masked conservatively. */
  financial?: boolean;
};

type Props = {
  title: string;
  outcome?: string;
  rows: ReceiptRow[];
  relatedRecords?: RelatedRecord[];
  relatedRecordsTitle?: string;
  nextActions: NextAction[];
  children?: ReactNode;
};

function ReceiptRowValue({ kind, value }: Pick<ReceiptRow, "kind" | "value">) {
  if (kind === "text") return value;
  return <FinancialValue>{value}</FinancialValue>;
}

function receiptActionLinkClassName(variant: NextActionVariant = "secondary") {
  return RECEIPT_ACTION_LINK_CLASS[variant];
}

export function TransactionReceipt({
  title,
  outcome,
  rows,
  relatedRecords,
  relatedRecordsTitle,
  nextActions,
  children,
}: Props) {
  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="transaction-receipt"
      role="status"
      aria-live="polite"
    >
      <Card className="items-center gap-(--space-3) border-success/20 bg-success/5 px-(--space-4) py-(--space-5) shadow-(--elevation-1)">
        <div className="flex size-14 items-center justify-center rounded-full border border-success/20 bg-success/15">
          <AppIcon
            icon={ACTION_ICONS.success}
            size="xl"
            className="text-success"
          />
        </div>
        <div className="flex flex-col items-center gap-(--space-1)">
          <Text size="lg" weight="semibold" className="text-text-primary">
            {title}
          </Text>
          {outcome ? (
            <Text size="sm" tone="secondary">
              {outcome}
            </Text>
          ) : null}
        </div>
      </Card>

      <TransactionFactsCard>
        {rows.map((row) => (
          <TransactionFactRow
            key={row.id}
            label={row.label}
            value={<ReceiptRowValue kind={row.kind} value={row.value} />}
          />
        ))}
      </TransactionFactsCard>

      {children}

      {relatedRecords && relatedRecords.length > 0 ? (
        <div className="flex flex-col gap-(--space-2)">
          {relatedRecordsTitle ? (
            <Text size="sm" weight="medium" className="text-text-primary">
              {relatedRecordsTitle}
            </Text>
          ) : null}
          <ul className="flex flex-col gap-(--space-2)">
            {relatedRecords.map((record) => (
              <li key={record.id}>
                {record.href ? (
                  <Link
                    href={record.href}
                    className={TRANSACTION_SURFACE_LINK_CLASS}
                  >
                    {record.label}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 w-full items-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm text-text-secondary">
                    {record.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-(--space-2)">
        {nextActions.map((action) => {
          if (action.href) {
            return (
              <Link
                key={action.id}
                href={action.href}
                className={receiptActionLinkClassName(action.variant)}
              >
                {action.label}
              </Link>
            );
          }
          return (
            <Button
              key={action.id}
              variant={action.variant ?? "secondary"}
              className="w-full"
              onPress={action.onPress}
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
