import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { Text } from "@/shared/ui/text";

type InvestmentDetailHeroProps = {
  icon: IconSvgElement;
  caption: string;
  name?: string;
  symbol?: string;
  provider?: string;
  quantityLabel?: string;
  ownership?: ReactNode;
  amountLabel?: string;
  unavailableLabel?: string;
  trailing?: ReactNode;
  context?: ReactNode;
};

/**
 * Holding identity and estimated value on the canonical neutral surface.
 */
export function InvestmentDetailHero({
  icon,
  caption,
  name,
  symbol,
  provider,
  quantityLabel,
  ownership,
  amountLabel,
  unavailableLabel,
  trailing,
  context,
}: InvestmentDetailHeroProps) {
  return (
    <Card
      tone="elevated"
      className="gap-(--space-3) p-(--space-4)"
      data-financial-object="investment"
      data-testid="investment-detail-hero"
    >
      {name ? (
        <div className="flex items-start gap-(--space-3) border-b border-border-subtle pb-(--space-3)">
          <IconContainer tone={IconContainerTone.INVESTMENT}>
            <AppIcon icon={icon} size={AppIconSize.MD} />
          </IconContainer>
          <div className="min-w-0 flex-1">
            <Text size="sm" weight="semibold" className="text-pretty">
              {name}
            </Text>
            {symbol ? (
              <Text size="xs" className="text-primary">
                {symbol}
              </Text>
            ) : null}
            {provider ? (
              <Text size="xs" tone="secondary" className="text-pretty">
                {provider}
              </Text>
            ) : null}
          </div>
          {ownership}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="xs" tone="secondary" className="uppercase tracking-wide">
          {caption}
        </Text>
        {trailing}
      </div>
      {amountLabel ? (
        <Amount
          amountLabel={amountLabel}
          kind={FinancialNumberKind.ESTIMATE}
          size={AmountSize.HERO}

          amountClassName="text-text-primary"
        />
      ) : (
        <Text
          size="sm"
          className="text-pretty text-text-secondary"
          data-testid="investment-detail-hero-unavailable"
        >
          {unavailableLabel}
        </Text>
      )}
      {quantityLabel ? (
        <Text size="sm" tone="secondary" tabular>
          <FinancialValue>{quantityLabel}</FinancialValue>
        </Text>
      ) : null}
      {context ? (
        <div className="flex flex-col gap-(--space-2)">{context}</div>
      ) : null}
    </Card>
  );
}
