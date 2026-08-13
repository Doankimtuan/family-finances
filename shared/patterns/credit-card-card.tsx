import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
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
  utilizationPct: number;
  utilizationLabel: ReactNode;
  dueLabel?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Credit card summary — outstanding / available are never bank Balance (BR-01).
 */
export function CreditCardCard({
  title,
  outstandingCaption,
  outstandingLabel,
  availableCaption,
  availableLabel,
  utilizationPct,
  utilizationLabel,
  dueLabel,
  className,
  "data-testid": testId,
}: CreditCardCardProps) {
  const barTone =
    utilizationPct >= CARD_UTILIZATION_DANGER_PCT
      ? "bg-danger"
      : utilizationPct >= CARD_UTILIZATION_WARN_PCT
        ? "bg-warning"
        : "bg-accent";

  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface/90 transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 p-(--space-4)",
        className,
      )}
      data-testid={testId ?? "credit-card-card"}
      data-utilization={utilizationPct}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <Text size="sm" className="truncate font-medium text-text-primary">
          {title}
        </Text>
        <Text size="sm" tone="secondary" className="shrink-0">
          {utilizationLabel}
        </Text>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-border-subtle"
        aria-hidden
      >
        <div
          className={cn("h-full rounded-full transition-[width]", barTone)}
          style={{
            width: `${Math.max(utilizationPct, utilizationPct > 0 ? 2 : 0)}%`,
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" tone="secondary">
            {outstandingCaption}
          </Text>
          <span className="text-sm font-semibold tabular-nums text-text-primary">
            {outstandingLabel}
          </span>
        </div>
        <div className="min-w-0 text-right">
          <Text size="sm" tone="secondary">
            {availableCaption}
          </Text>
          <span className="text-sm font-semibold tabular-nums text-text-primary">
            {availableLabel}
          </span>
        </div>
      </div>
      {dueLabel ? (
        <Text size="sm" tone="secondary">
          {dueLabel}
        </Text>
      ) : null}
    </div>
  );
}
