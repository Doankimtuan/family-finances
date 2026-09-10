import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Text } from "@/shared/ui/text";

type InvestmentDetailHeroProps = {
  icon: IconSvgElement;
  caption: string;
  amountLabel?: string;
  unavailableLabel?: string;
  trailing?: ReactNode;
  context?: ReactNode;
};

/**
 * Holding detail hero: one estimated-value story on the brand surface.
 * Identity stays in the TopAppBar; gain/loss stays off the hero.
 */
export function InvestmentDetailHero({
  icon,
  caption,
  amountLabel,
  unavailableLabel,
  trailing,
  context,
}: InvestmentDetailHeroProps) {
  return (
    <Card
      tone="hero"
      className="gap-0 p-(--space-4)"
      data-financial-object="investment"
      data-testid="investment-detail-hero"
    >
      <div className="flex items-center gap-(--space-3)">
        <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
            <AppIcon icon={icon} size={AppIconSize.MD} emphasized />
          </span>
          <Text
            size="sm"
            weight="medium"
            className="text-pretty text-hero-muted"
          >
            {caption}
          </Text>
        </div>
        {trailing}
      </div>
      {amountLabel ? (
        <Amount
          amountLabel={amountLabel}
          kind={FinancialNumberKind.ESTIMATE}
          size={AmountSize.HERO}
          className="mt-(--space-3)"
          amountClassName="text-hero-fg"
        />
      ) : (
        <Text
          size="sm"
          className="mt-(--space-3) text-pretty text-hero-muted"
          data-testid="investment-detail-hero-unavailable"
        >
          {unavailableLabel}
        </Text>
      )}
      {context ? (
        <div className="mt-(--space-4) flex flex-col gap-(--space-2) border-t border-white/15 pt-(--space-3)">
          {context}
        </div>
      ) : null}
    </Card>
  );
}
