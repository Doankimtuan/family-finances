"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { Section } from "@/shared/patterns/section";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { AppIcon } from "@/shared/ui/app-icon";
import { FinancialValue } from "@/shared/patterns/financial-value";

type RelatedRecord = {
  id: string;
  label: string;
  href?: string;
};

type NextAction = {
  id: string;
  label: string;
  href?: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "tertiary";
};

type Props = {
  title: string;
  outcome?: string;
  rows: {
    id: string;
    label: string;
    value: React.ReactNode;
    kind?: "text" | "financial";
    /** Unclassified legacy rows are masked conservatively. */
    financial?: boolean;
  }[];
  relatedRecords?: RelatedRecord[];
  relatedRecordsTitle?: string;
  nextActions: NextAction[];
  children?: React.ReactNode;
};

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
    >
      <div className="flex flex-col items-center gap-(--space-3) py-(--space-2)">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <AppIcon
            icon={CheckmarkCircle02Icon}
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
      </div>

      <Section variant="surface">
        <dl className="flex flex-col gap-(--space-3)">
          {rows.map(({ id, label, value, kind }) => (
            <div key={id} className="flex justify-between gap-(--space-3)">
              <Text size="sm" tone="secondary">
                {label}
              </Text>
              <Text
                size="sm"
                className="text-right font-medium text-text-primary"
              >
                {kind !== "text" && kind !== undefined ? (
                  <FinancialValue>{value}</FinancialValue>
                ) : kind === "text" ? (
                  value
                ) : (
                  <FinancialValue>{value}</FinancialValue>
                )}
              </Text>
            </div>
          ))}
        </dl>
      </Section>

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
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {record.label}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 w-full items-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm text-text-secondary">
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
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-md px-(--space-4) text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                  action.variant === "primary"
                    ? "bg-accent text-accent-fg"
                    : action.variant === "tertiary"
                      ? "text-text-secondary"
                      : "border border-border-subtle bg-surface text-text-primary"
                }`}
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
