import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Text } from "@/shared/ui/text";
import { Balance, BalanceSize } from "./balance";
import { Card } from "./card";

export type FinancialAccountHeroProps = {
  icon: IconSvgElement;
  amountLabel: string;
  amountCaption: ReactNode;
  /** Quiet context row under the balance (ownership, health note). */
  context?: ReactNode;
  /** Trailing control on the caption row (privacy toggle). */
  trailing?: ReactNode;
  className?: string;
  testId?: string;
};

/**
 * Primary owned-account summary on its detail screen: identity icon + the one
 * spendable balance on the brand hero surface, with ownership/state as a quiet
 * context row. Account name/type live in the screen header, never duplicated
 * here.
 */
export function FinancialAccountHero({
  icon,
  amountLabel,
  amountCaption,
  context,
  trailing,
  className,
  testId = "account-detail-hero",
}: FinancialAccountHeroProps) {
  return (
    <Card
      tone="hero"
      className={cn("gap-0 p-(--space-4)", className)}
      data-testid={testId}
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
            {amountCaption}
          </Text>
        </div>
        {trailing}
      </div>
      <Balance
        amountLabel={amountLabel}
        size={BalanceSize.HERO}
        className="mt-(--space-3)"
        amountClassName="text-4xl leading-none text-hero-fg"
      />
      {context ? (
        <div className="mt-(--space-4) flex flex-col gap-(--space-2) border-t border-white/15 pt-(--space-3)">
          {context}
        </div>
      ) : null}
    </Card>
  );
}
