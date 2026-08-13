import { useTranslations } from "next-intl";
import type { HomeFinancialMetrics } from "@/modules/home/application";
import {
  HOME_CURRENCY_FRACTION_DIGITS,
  HOME_TEST_ID,
} from "@/modules/home/application/home-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { KpiBlock } from "@/shared/patterns/kpi-block";
import { Text } from "@/shared/ui/text";
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
  const rows = [
    { key: "income", amount: metrics.income, tone: "text-accent" },
    { key: "expense", amount: metrics.expense, tone: "text-danger" },
    { key: "net", amount: metrics.netCashFlow, tone: "text-text-primary" },
  ] as const;

  return (
    <KpiBlock
      title={t("cashFlow.title")}
      description={t("cashFlow.hint")}
      data-testid={HOME_TEST_ID.CASH_FLOW}
    >
      <div className="flex flex-col gap-(--space-4)">
        <div className="grid grid-cols-3 gap-(--space-2)">
          {rows.map((row) => (
            <div key={row.key} className="min-w-0">
              <Text size="sm" tone="secondary">
                {t(`cashFlow.${row.key}`)}
              </Text>
              <Text
                size="sm"
                className={`mt-(--space-1) truncate font-semibold tabular-nums ${row.tone}`}
              >
                {formatCurrency(row.amount, currency, locale, {
                  maximumFractionDigits: HOME_CURRENCY_FRACTION_DIGITS,
                })}
              </Text>
            </div>
          ))}
        </div>
        <HomeCashFlowChart
          trend={metrics.trend}
          currency={currency}
          locale={locale}
        />
      </div>
    </KpiBlock>
  );
}
