import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { FINANCE_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { HomeCashFlowChart } from "./home-cash-flow-chart";

export function HomeCashFlowSection({
  metrics,
  currency,
  locale,
}: {
  metrics: HomeFinancialMetrics;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("home");
  const comparisonRows = [
    {
      key: "income",
      amount: metrics.income,
      amountTone: "success",
      iconTone: IconContainerTone.INCOME,
      icon: FINANCE_ICONS.income,
    },
    {
      key: "expense",
      amount: metrics.expense,
      amountTone: "danger",
      iconTone: IconContainerTone.EXPENSE,
      icon: FINANCE_ICONS.expense,
    },
  ] as const;

  return (
    <div
      id="home-cash-flow-summary"
      className="flex flex-col gap-(--space-4)"
      data-testid={HOME_TEST_ID.CASH_FLOW}
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <Heading level={3} className="text-sm font-semibold text-text-primary">
          {t("cashFlow.title")}
        </Heading>
        <details className="text-right text-xs text-text-secondary">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-(--space-1) rounded-(--radius-control) px-(--space-2) font-medium hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
            <AppIcon icon={UTILITY_ICONS.info} size={AppIconSize.XS} />
            {t("cashFlow.infoLabel")}
          </summary>
          <span className="mt-(--space-1) block max-w-72 text-pretty leading-relaxed">
            {t("cashFlow.hint")}
          </span>
        </details>
      </div>
      <Text size="xs" tone="secondary" className="text-pretty">
        {t("cashFlow.summaryHint")}
      </Text>
      <dl className="grid grid-cols-2 gap-(--space-3)">
        {comparisonRows.map((row) => (
          <div key={row.key} className="flex items-start gap-(--space-2)">
            <IconContainer tone={row.iconTone} size="sm">
              <AppIcon icon={row.icon} size={AppIconSize.SM} />
            </IconContainer>
            <div className="min-w-0">
              <Text as="dt" size="sm" tone="secondary">
                {t(`cashFlow.${row.key}`)}
              </Text>
              <Text
                as="dd"
                size="lg"
                tone={row.amountTone}
                weight="semibold"
                tabular
                className="tracking-tight"
              >
                <FinancialValue>
                  {formatCurrency(row.amount, currency, locale, {
                    maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                  })}
                </FinancialValue>
              </Text>
            </div>
          </div>
        ))}
      </dl>
      <div id="home-cash-flow-trend" className="flex flex-col gap-(--space-2)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Heading
            level={3}
            className="text-sm font-medium tracking-normal text-text-secondary"
          >
            {t("cashFlow.trendLabel")}
          </Heading>
          <div
            className="flex items-center gap-(--space-3)"
            role="group"
            aria-label={t("cashFlow.legend.label")}
          >
            <span className="inline-flex items-center gap-(--space-1)">
              <span
                aria-hidden
                className="inline-block h-0.5 w-4 rounded-full bg-chart-positive"
              />
              <Text size="xs" tone="secondary">
                {t("cashFlow.income")}
              </Text>
            </span>
            <span className="inline-flex items-center gap-(--space-1)">
              <span
                aria-hidden
                className="inline-block w-4 border-t-2 border-dashed border-chart-negative"
              />
              <Text size="xs" tone="secondary">
                {t("cashFlow.expense")}
              </Text>
            </span>
          </div>
        </div>
        <HomeCashFlowChart
          trend={metrics.trend}
          currency={currency}
          locale={locale}
        />
      </div>
    </div>
  );
}
