"use client";

import { useTranslations } from "next-intl";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Balance, BalanceSize, Card } from "@/shared/patterns";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";
import { HeroPillLink } from "@/shared/patterns/hero-pill-link";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";

export { resolveHomeFinancialPulseState } from "./home-movement-strip";

/**
 * Home financial hero: one current-state number for total assets, plus the
 * path to full activity. Period movement lives in the period story.
 */
export function HomeFinancialPulse({
  balance,
  balanceNote,
  currency,
  locale,
}: {
  balance: number | null;
  balanceNote?: string;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("home");

  return (
    <Card
      tone="hero"
      className="gap-0 p-(--space-4)"
      data-testid={HOME_TEST_ID.FINANCIAL_PULSE}
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <Text size="sm" weight="medium" className="text-hero-muted">
          {t("financialPulse.title")}
        </Text>
        <FinancialPrivacyToggle
          hideLabel={t("financialPrivacy.hide")}
          showLabel={t("financialPrivacy.show")}
          testId={HOME_TEST_ID.FINANCIAL_PRIVACY_TOGGLE}
        />
      </div>
      <div
        className="mt-(--space-2)"
        role="group"
        aria-label={t("financialPulse.accessibleLabel")}
      >
        {balance == null ? (
          <Text size="lg" weight="semibold" className="text-hero-fg">
            {t("financialPulse.unavailable")}
          </Text>
        ) : (
          <Balance
            amountLabel={formatCurrency(balance, currency, locale, {
              maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
            })}
            size={BalanceSize.HERO}
            amountClassName="text-hero-fg"
          />
        )}
      </div>
      <div className="mt-(--space-4) flex flex-wrap items-center justify-between gap-x-(--space-3) gap-y-(--space-2) border-t border-white/15 pt-(--space-3)">
        <Text size="xs" className="min-w-0 flex-1 text-pretty text-hero-muted">
          {balanceNote ?? t("financialPulse.hint")}
        </Text>
        <HeroPillLink
          href={APP_PATH.MONEY_TRANSACTIONS}
          data-testid={HOME_TEST_ID.TRANSACTIONS_LINK}
        >
          {t("periodStory.viewTransactions")}
          <AppIcon icon={ACTION_ICONS.forward} size="xs" />
        </HeroPillLink>
      </div>
    </Card>
  );
}
