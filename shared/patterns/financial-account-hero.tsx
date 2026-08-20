import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { Text } from "@/shared/ui/text";
import { Balance, BalanceSize } from "./balance";

export type FinancialAccountHeroProps = {
  icon: IconSvgElement;
  iconTone: IconContainerTone;
  eyebrow: ReactNode;
  title: ReactNode;
  identitySupporting?: ReactNode;
  amountLabel: string;
  amountCaption: ReactNode;
  supporting?: ReactNode;
  className?: string;
};

/**
 * Primary owned-account summary. It intentionally focuses on one immediately
 * spendable balance, with only a compact supporting fact beneath it.
 */
export function FinancialAccountHero({
  icon,
  iconTone,
  eyebrow,
  title,
  identitySupporting,
  amountLabel,
  amountCaption,
  supporting,
  className,
}: FinancialAccountHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface/90 p-(--space-4)",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <IconContainer tone={iconTone} size="md">
            <AppIcon icon={icon} size="lg" emphasized />
          </IconContainer>
          <div className="min-w-0">
            <Text
              size="sm"
              weight="medium"
              className="break-words text-text-primary"
            >
              {title}
            </Text>
            {eyebrow ? (
              <Text size="xs" tone="secondary" className="break-words">
                {eyebrow}
              </Text>
            ) : null}
            {identitySupporting ? (
              <div className="mt-(--space-1)">{identitySupporting}</div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-(--space-4)">
        <Balance
          amountLabel={amountLabel}
          label={amountCaption}
          size={BalanceSize.LG}
        />
      </div>
      {supporting ? (
        <div className="mt-(--space-3) border-t border-border-subtle/70 pt-(--space-3)">
          {supporting}
        </div>
      ) : null}
    </section>
  );
}
