import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { Amount, AmountSize, AmountTone } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { Progress } from "@/shared/ui/progress";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge, type StatusBadgeTone } from "@/shared/ui/status-badge";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import {
  CARD_UTILIZATION_DANGER_PCT,
  CARD_UTILIZATION_WARN_PCT,
} from "@/modules/ledger/application/client";

export type CreditCardCardProps = {
  title: ReactNode;
  typeLabel?: ReactNode;
  outstandingCaption: ReactNode;
  outstandingLabel: string;
  availableCaption: ReactNode;
  availableLabel: string;
  limitCaption?: ReactNode;
  limitLabel?: string;
  utilizationPct: number | null;
  utilizationLabel: ReactNode;
  utilizationAriaLabel?: string;
  dueLabel?: ReactNode;
  attentionLabel?: ReactNode;
  attentionTone?: StatusBadgeTone;
  className?: string;
  "data-testid"?: string;
};

/**
 * Credit-card summary — outstanding / available are never bank Balance (BR-01).
 * Utilization is shown only when the domain has a positive credit limit.
 */
export function CreditCardCard({
  title,
  typeLabel,
  outstandingCaption,
  outstandingLabel,
  availableCaption,
  availableLabel,
  limitCaption,
  limitLabel,
  utilizationPct,
  utilizationLabel,
  utilizationAriaLabel,
  dueLabel,
  attentionLabel,
  attentionTone = "neutral",
  className,
  "data-testid": testId,
}: CreditCardCardProps) {
  const barTone =
    utilizationPct != null && utilizationPct >= CARD_UTILIZATION_DANGER_PCT
      ? "bg-danger"
      : utilizationPct != null && utilizationPct >= CARD_UTILIZATION_WARN_PCT
        ? "bg-warning"
        : "bg-accent";
  const progressValue =
    utilizationPct == null ? null : Math.min(Math.max(utilizationPct, 0), 100);

  return (
    <Card
      tone="default"
      className={cn(
        "flex min-h-11 flex-col gap-(--space-3) p-(--space-3) transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      data-testid={testId ?? "credit-card-card"}
      data-financial-object="credit-card"
      data-surface="soft-bounded"
      data-utilization={utilizationPct ?? undefined}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-start gap-(--space-3)">
          <IconContainer tone="debt" size="sm">
            <AppIcon icon={FINANCE_ICONS.card} size="sm" />
          </IconContainer>
          <div className="min-w-0">
            <Text
              size="sm"
              className="break-words font-semibold text-text-primary"
            >
              {title}
            </Text>
            {typeLabel ? (
              <Text size="xs" tone="secondary">
                {typeLabel}
              </Text>
            ) : null}
          </div>
        </div>
        <Text size="sm" tone="secondary" className="shrink-0 tabular-nums">
          {utilizationLabel}
        </Text>
      </div>
      {progressValue != null ? (
        <Progress
          value={progressValue}
          label={utilizationAriaLabel}
          showLabel={false}
          trackClassName="bg-border-subtle"
          indicatorClassName={barTone}
        />
      ) : null}
      <Amount
        label={outstandingCaption}
        amountLabel={outstandingLabel}
        tone={AmountTone.NEUTRAL}
        size={AmountSize.MD}
        className="min-w-0"
      />
      <div className="grid min-w-0 grid-cols-2 gap-(--space-3)">
        <Amount
          label={availableCaption}
          amountLabel={availableLabel}
          size={AmountSize.SM}
          className="min-w-0"
          amountClassName="break-words text-base text-text-secondary"
        />
        {limitCaption && limitLabel ? (
          <Amount
            label={limitCaption}
            amountLabel={limitLabel}
            size={AmountSize.SM}
            className="min-w-0"
            amountClassName="break-words text-base text-text-secondary"
          />
        ) : null}
      </div>
      {dueLabel || attentionLabel ? (
        <div className="flex flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)">
          {dueLabel ? (
            <Text size="sm" tone="secondary">
              {dueLabel}
            </Text>
          ) : null}
          {attentionLabel ? (
            <StatusBadge tone={attentionTone}>{attentionLabel}</StatusBadge>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
