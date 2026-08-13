import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { Text } from "@/shared/ui/text";

export type FinancialAccountHeroProps = {
  icon: IconSvgElement;
  iconTone: IconContainerTone;
  eyebrow: ReactNode;
  title: ReactNode;
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
  amountLabel,
  amountCaption,
  supporting,
  className,
}: FinancialAccountHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface/90 p-(--space-4) shadow-[var(--elevation-1)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <IconContainer tone={iconTone} size="md">
            <AppIcon icon={icon} size="lg" emphasized />
          </IconContainer>
          <div className="min-w-0">
            <Text size="sm" tone="secondary" className="truncate">
              {eyebrow}
            </Text>
            <Text
              size="sm"
              weight="medium"
              className="truncate text-text-primary"
            >
              {title}
            </Text>
          </div>
        </div>
      </div>
      <div className="mt-(--space-5)">
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-text-primary">
          {amountLabel}
        </p>
        <Text size="sm" tone="secondary" className="mt-(--space-1)">
          {amountCaption}
        </Text>
      </div>
      {supporting ? (
        <div className="mt-(--space-4) border-t border-border-subtle/70 pt-(--space-3)">
          {supporting}
        </div>
      ) : null}
    </section>
  );
}
