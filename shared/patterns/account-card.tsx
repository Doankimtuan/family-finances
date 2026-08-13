import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";
import {
  AccountHealthSignal,
  type AccountHealthSignal as AccountHealthSignalValue,
} from "@/modules/ledger/application/client";

export type AccountCardProps = {
  title: ReactNode;
  typeLabel: ReactNode;
  balanceLabel: string;
  healthSignal?: AccountHealthSignalValue;
  healthLabel?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Liquid ledger account row — balance is Real Position contribution (BR-01).
 */
export function AccountCard({
  title,
  typeLabel,
  balanceLabel,
  healthSignal,
  healthLabel,
  className,
  "data-testid": testId,
}: AccountCardProps) {
  const showHealth =
    healthSignal === AccountHealthSignal.ZERO && healthLabel != null;

  return (
    <div
      className={cn(
        "flex flex-col gap-(--space-2) rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface/90 transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 p-(--space-4)",
        className,
      )}
      data-testid={testId ?? "account-card"}
      data-account-health={healthSignal}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" className="truncate font-medium text-text-primary">
            {title}
          </Text>
          <Text size="sm" tone="secondary" className="truncate">
            {typeLabel}
          </Text>
        </div>
        <span
          className="shrink-0 text-sm font-semibold tabular-nums text-text-primary"
          data-testid="account-card-balance"
        >
          {balanceLabel}
        </span>
      </div>
      {showHealth ? (
        <StatusBadge tone="warning" data-testid="account-card-health">
          {healthLabel}
        </StatusBadge>
      ) : null}
    </div>
  );
}
