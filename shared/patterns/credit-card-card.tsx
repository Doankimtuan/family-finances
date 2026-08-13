import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
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
    <div
      className={cn(
        "flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/65 bg-surface/85 p-(--space-4) transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      data-testid={testId ?? "credit-card-card"}
      data-utilization={utilizationPct ?? undefined}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <IconContainer tone="debt" size="sm">
            <AppIcon icon={FINANCE_ICONS.card} size="sm" />
          </IconContainer>
          <Text size="sm" className="truncate font-medium text-text-primary">
            {title}
          </Text>
        </div>
        <Text size="sm" tone="secondary" className="shrink-0 tabular-nums">
          {utilizationLabel}
        </Text>
      </div>
      {progressValue != null ? (
        <div
          role="progressbar"
          aria-label={utilizationAriaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
          className="h-2 overflow-hidden rounded-full bg-border-subtle"
        >
          <div
            className={cn("h-full rounded-full transition-[width]", barTone)}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" tone="secondary">
            {outstandingCaption}
          </Text>
          <span className="text-xl font-semibold tabular-nums text-text-primary">
            {outstandingLabel}
          </span>
        </div>
        <div className="min-w-0 text-right">
          <Text size="sm" tone="secondary">
            {availableCaption}
          </Text>
          <span className="text-sm font-medium tabular-nums text-text-secondary">
            {availableLabel}
          </span>
        </div>
      </div>
      {limitCaption && limitLabel ? (
        <Text size="sm" tone="secondary">
          {limitCaption}: <span className="tabular-nums">{limitLabel}</span>
        </Text>
      ) : null}
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
    </div>
  );
}
