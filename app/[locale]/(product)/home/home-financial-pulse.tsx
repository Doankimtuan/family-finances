"use client";

import { useTranslations } from "next-intl";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  Balance,
  BalanceSize,
  Card,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
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
      className="relative gap-0 overflow-hidden bg-linear-to-br from-surface via-surface to-primary/10 text-text-primary p-(--space-4) dark:to-primary/20"
      data-testid={HOME_TEST_ID.FINANCIAL_PULSE}
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-2)">
          <span
            className="size-2 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          <Text
            size="xs"
            weight="semibold"
            className="uppercase text-text-muted"
          >
            {t("financialPulse.title")}
          </Text>
        </div>
        <FinancialPrivacyToggle
          hideLabel={t("financialPrivacy.hide")}
          showLabel={t("financialPrivacy.show")}
          tone={FinancialPrivacyToggleTone.SURFACE}
          testId={HOME_TEST_ID.FINANCIAL_PRIVACY_TOGGLE}
        />
      </div>

      <div
        className="mt-(--space-2)"
        role="group"
        aria-label={t("financialPulse.accessibleLabel")}
      >
        {balance == null ? (
          <Text size="lg" weight="semibold" className="text-text-primary">
            {t("financialPulse.unavailable")}
          </Text>
        ) : (
          <Balance
            amountLabel={formatCurrency(balance, currency, locale, {
              maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
            })}
            size={BalanceSize.HERO}
            amountClassName="text-text-primary"
          />
        )}
      </div>

      <Text
        size="sm"
        className="mt-(--space-2) text-pretty text-text-secondary leading-relaxed"
      >
        {balanceNote ?? t("financialPulse.hint")}
      </Text>
      <Link
        href={APP_PATH.MONEY_TRANSACTIONS}
        prefetch={PRODUCT_LINK_PREFETCH}
        data-testid={HOME_TEST_ID.TRANSACTIONS_LINK}
        className="mt-(--space-4) inline-flex min-h-11 items-center justify-end gap-(--space-1) border-t border-border-subtle/60 pt-(--space-3) text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("financialPulse.viewStatement")}
        <AppIcon icon={ACTION_ICONS.forward} size="xs" />
      </Link>
    </Card>
  );
}
