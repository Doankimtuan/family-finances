import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
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
        "flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-4)",
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
        <span
          className="w-fit rounded-md border border-border-subtle px-(--space-2) py-(--space-1) text-xs font-medium text-text-secondary"
          data-testid="account-card-health"
        >
          {healthLabel}
        </span>
      ) : null}
    </div>
  );
}
