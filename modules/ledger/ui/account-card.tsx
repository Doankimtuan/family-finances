import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { cn } from "@/shared/utils/cn";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Balance, BalanceSize } from "@/shared/patterns/balance";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  AccountHealthSignal,
  type AccountHealthSignal as AccountHealthSignalValue,
} from "@/modules/ledger/application/client";

export type AccountCardProps = {
  title: ReactNode;
  typeLabel: ReactNode;
  balanceLabel: string;
  balanceCaption?: ReactNode;
  icon?: IconSvgElement;
  iconTone?: IconContainerTone;
  metadata?: ReactNode;
  healthSignal?: AccountHealthSignalValue;
  healthLabel?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * Liquid ledger account object — balance is a Real Position contribution (BR-01).
 */
export function AccountCard({
  title,
  typeLabel,
  balanceLabel,
  balanceCaption,
  icon,
  iconTone,
  metadata,
  healthSignal,
  healthLabel,
  className,
  "data-testid": testId,
}: AccountCardProps) {
  const showHealth =
    healthSignal === AccountHealthSignal.ZERO && healthLabel != null;
  const showTypeLabel =
    typeof title !== "string" ||
    typeof typeLabel !== "string" ||
    title.trim().toLowerCase() !== typeLabel.trim().toLowerCase();

  return (
    <div
      className={cn(
        "flex min-h-11 flex-col gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface/90 p-(--space-3) transition-[background-color,border-color,transform] duration-(--duration-fast) active:scale-[var(--press-scale)] hover:border-border-default hover:bg-surface-hover motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      data-testid={testId ?? "account-card"}
      data-financial-object="account"
      data-surface="soft-bounded"
      data-account-health={healthSignal}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          {icon ? (
            <IconContainer tone={iconTone} size="sm">
              <AppIcon icon={icon} size="sm" />
            </IconContainer>
          ) : null}
          <div className="min-w-0">
            <Text
              size="sm"
              className="break-words font-medium text-text-primary"
            >
              {title}
            </Text>
            {showTypeLabel ? (
              <Text size="sm" tone="secondary" className="break-words">
                {typeLabel}
              </Text>
            ) : null}
          </div>
        </div>
        <div data-testid="account-card-balance">
          <Balance
            amountLabel={balanceLabel}
            label={balanceCaption}
            size={BalanceSize.SM}
            className="min-w-0 items-end text-right"
            labelClassName="text-xs"
            amountClassName="max-w-full break-words text-base"
          />
        </div>
      </div>
      {metadata ? <div>{metadata}</div> : null}
      {showHealth ? (
        <StatusBadge tone="warning" data-testid="account-card-health">
          {healthLabel}
        </StatusBadge>
      ) : null}
    </div>
  );
}
