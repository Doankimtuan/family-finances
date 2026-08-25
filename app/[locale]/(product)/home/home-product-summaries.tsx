import { Link } from "@/i18n/navigation";
import type { _Translator } from "use-intl";
import type { AppMessages } from "../../../../global";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  HomeProductReadStatus,
  type HomeDebtSummary,
  type HomeInvestmentSummary,
  type HomeLoanSummary,
  type HomeProductReadResult,
  type HomeSavingsSummary,
} from "@/modules/home/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";

type Props = {
  locale: string;
  currency: string;
  savings: HomeProductReadResult<HomeSavingsSummary>;
  investments: HomeProductReadResult<HomeInvestmentSummary>;
  loans: HomeProductReadResult<HomeLoanSummary>;
  debt: HomeProductReadResult<HomeDebtSummary>;
  t: _Translator<AppMessages, "home">;
};

function money(value: number, currency: string, locale: string) {
  return formatCurrency(value, currency, locale, { maximumFractionDigits: 0 });
}

function ProductRow({
  href,
  label,
  detail,
  attention,
  value,
  unavailable,
}: {
  href: string;
  label: string;
  detail: string;
  attention: boolean;
  value?: React.ReactNode;
  unavailable: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-(--space-3) border-b border-divider py-(--space-3) last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <div className="min-w-0">
        <Text weight="semibold" className="text-text-primary">
          {label}
        </Text>
        <Text
          size="sm"
          tone={attention ? "primary" : "secondary"}
          className="text-pretty"
        >
          {attention ? "• " : ""}
          {detail}
        </Text>
      </div>
      <Text
        size="sm"
        weight="semibold"
        className="shrink-0 text-right text-text-primary"
      >
        {value ?? unavailable}
      </Text>
    </Link>
  );
}

export function HomeProductSummaries({
  locale,
  currency,
  savings,
  investments,
  loans,
  debt,
  t,
}: Props) {
  const investment =
    investments.status === HomeProductReadStatus.READY
      ? investments.summary
      : null;
  const investmentPartial =
    investment != null &&
    investment.valuationIncluded < investment.valuationTotal;
  const investmentDetail =
    investment == null
      ? t("productSummary.unavailable")
      : investmentPartial
        ? `${t("productSummary.investments.incomplete", { included: investment.valuationIncluded, total: investment.valuationTotal })} · ${investment.valuationStale ? t("productSummary.investments.quality.stale") : t("productSummary.investments.quality.partial")}`
        : t(
            `productSummary.investments.quality.${investment.valuationQuality}`,
          );
  return (
    <Section
      title={t("productSummary.title")}
      description={t("productSummary.hint")}
      testId={HOME_TEST_ID.PRODUCT_SUMMARIES}
    >
      <Card tone="elevated" className="px-(--space-4)">
        {savings.status === HomeProductReadStatus.READY ? (
          <ProductRow
            href={APP_PATH.MONEY_SAVINGS}
            label={t("productSummary.savings.label")}
            detail={
              savings.summary.actionRequiredCount > 0
                ? t("productSummary.savings.attention", {
                    count: savings.summary.actionRequiredCount,
                  })
                : t("productSummary.savings.detail", {
                    count: savings.summary.activeCount,
                  })
            }
            attention={savings.summary.actionRequiredCount > 0}
            value={
              <FinancialValue>
                {money(savings.summary.principal, currency, locale)}
              </FinancialValue>
            }
            unavailable={t("common.unavailable")}
          />
        ) : (
          <ProductRow
            href={APP_PATH.MONEY_SAVINGS}
            label={t("productSummary.savings.label")}
            detail={t("productSummary.unavailable")}
            attention
            value={undefined}
            unavailable={t("common.unavailable")}
          />
        )}
        {investment ? (
          <ProductRow
            href={APP_PATH.MONEY_INVESTMENTS}
            label={t("productSummary.investments.label")}
            detail={investmentDetail}
            attention={
              investment.valuationQuality !== "current" || investmentPartial
            }
            value={
              investment.marketValue == null ? undefined : (
                <FinancialValue>
                  {money(investment.marketValue, currency, locale)}
                </FinancialValue>
              )
            }
            unavailable={t("common.unavailable")}
          />
        ) : (
          <ProductRow
            href={APP_PATH.MONEY_INVESTMENTS}
            label={t("productSummary.investments.label")}
            detail={t("productSummary.unavailable")}
            attention
            value={undefined}
            unavailable={t("common.unavailable")}
          />
        )}
        {loans.status === HomeProductReadStatus.READY ? (
          <ProductRow
            href={APP_PATH.MONEY_LOANS}
            label={t("productSummary.loans.label")}
            detail={
              loans.summary.attentionCount > 0
                ? t("productSummary.loans.attention", {
                    count: loans.summary.attentionCount,
                  })
                : t("productSummary.loans.detail", {
                    count: loans.summary.activeCount,
                  })
            }
            attention={loans.summary.attentionCount > 0}
            value={
              <FinancialValue>
                {money(loans.summary.remainingPrincipal, currency, locale)}
              </FinancialValue>
            }
            unavailable={t("common.unavailable")}
          />
        ) : (
          <ProductRow
            href={APP_PATH.MONEY_LOANS}
            label={t("productSummary.loans.label")}
            detail={t("productSummary.unavailable")}
            attention
            value={undefined}
            unavailable={t("common.unavailable")}
          />
        )}
        {debt.status === HomeProductReadStatus.READY ? (
          <ProductRow
            href={APP_PATH.MONEY_DEBTS}
            label={t("productSummary.debt.label")}
            detail={
              debt.summary.attentionCount > 0
                ? t("productSummary.debt.attention", {
                    count: debt.summary.attentionCount,
                  })
                : t("productSummary.debt.detail", {
                    count: debt.summary.activeCount,
                  })
            }
            attention={debt.summary.attentionCount > 0}
            value={
              <FinancialValue>
                {money(
                  debt.summary.borrowedRemaining + debt.summary.lentRemaining,
                  currency,
                  locale,
                )}
              </FinancialValue>
            }
            unavailable={t("common.unavailable")}
          />
        ) : (
          <ProductRow
            href={APP_PATH.MONEY_DEBTS}
            label={t("productSummary.debt.label")}
            detail={t("productSummary.unavailable")}
            attention
            value={undefined}
            unavailable={t("common.unavailable")}
          />
        )}
      </Card>
    </Section>
  );
}
