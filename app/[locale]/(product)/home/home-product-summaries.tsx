import type { ReactNode } from "react";
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
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { InvestmentHomeValuationQuality } from "@/modules/investments/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  IconContainerTone,
  type IconContainerTone as IconContainerToneValue,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";

type Props = {
  locale: string;
  currency: string;
  savings: HomeProductReadResult<HomeSavingsSummary>;
  investments: HomeProductReadResult<HomeInvestmentSummary>;
  loans: HomeProductReadResult<HomeLoanSummary>;
  debt: HomeProductReadResult<HomeDebtSummary>;
  t: _Translator<AppMessages, "home">;
};

const PRODUCT_ROW_CLASS =
  "flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring";

type ProductVisual = {
  icon: (typeof FINANCE_ICONS)[keyof typeof FINANCE_ICONS];
  tone: IconContainerToneValue;
};

const PRODUCT_ROW_VISUAL = {
  savings: {
    icon: FINANCE_ICONS.savings,
    tone: IconContainerTone.SAVINGS,
  },
  investments: {
    icon: FINANCE_ICONS.investment,
    tone: IconContainerTone.INVESTMENT,
  },
  loans: {
    icon: FINANCE_ICONS.loan,
    tone: IconContainerTone.DEBT,
  },
  debt: {
    icon: FINANCE_ICONS.debt,
    tone: IconContainerTone.DEBT,
  },
} as const satisfies Record<string, ProductVisual>;

function money(value: number, currency: string, locale: string) {
  return formatCurrency(value, currency, locale, { maximumFractionDigits: 0 });
}

function ProductRow({
  href,
  visual,
  label,
  detail,
  attention,
  value,
  unavailable,
}: {
  href: string;
  visual: ProductVisual;
  label: string;
  detail: string;
  attention: boolean;
  value?: ReactNode;
  unavailable: string;
}) {
  return (
    <Link href={href} className={PRODUCT_ROW_CLASS}>
      <IconContainer tone={visual.tone} size="sm">
        <AppIcon icon={visual.icon} size="sm" />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text size="sm" className="font-medium text-text-primary">
          {label}
        </Text>
        {attention ? (
          <StatusBadge
            tone={StatusBadgeTone.WARNING}
            className="mt-(--space-1) font-medium"
          >
            {detail}
          </StatusBadge>
        ) : (
          <Text
            size="xs"
            tone="muted"
            className="mt-(--space-1) block text-pretty"
          >
            {detail}
          </Text>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-(--space-2)">
        {value != null ? (
          <Text
            size="sm"
            weight="semibold"
            tabular
            className="tracking-tight text-text-primary"
          >
            {value}
          </Text>
        ) : (
          <Text size="sm" tabular tone="secondary">
            {unavailable}
          </Text>
        )}
        <AppIcon
          icon={ACTION_ICONS.forward}
          size="sm"
          className="shrink-0 text-text-tertiary"
        />
      </div>
    </Link>
  );
}

function investmentDetail(
  investment: HomeInvestmentSummary,
  t: Props["t"],
): string {
  const investmentPartial =
    investment.valuationIncluded < investment.valuationTotal;
  if (!investmentPartial) {
    return t(
      `productSummary.investments.quality.${investment.valuationQuality}`,
    );
  }
  const incomplete = t("productSummary.investments.incomplete", {
    included: investment.valuationIncluded,
    total: investment.valuationTotal,
  });
  const quality = investment.valuationStale
    ? t("productSummary.investments.quality.stale")
    : t("productSummary.investments.quality.partial");
  return `${incomplete}. ${quality}`;
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
  const unavailable = t("common.unavailable");

  return (
    <Section
      title={t("productSummary.title")}
      description={t("productSummary.hint")}
      testId={HOME_TEST_ID.PRODUCT_SUMMARIES}
    >
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          {savings.status === HomeProductReadStatus.READY ? (
            <ProductRow
              href={APP_PATH.MONEY_SAVINGS}
              visual={PRODUCT_ROW_VISUAL.savings}
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
              unavailable={unavailable}
            />
          ) : (
            <ProductRow
              href={APP_PATH.MONEY_SAVINGS}
              visual={PRODUCT_ROW_VISUAL.savings}
              label={t("productSummary.savings.label")}
              detail={t("productSummary.unavailable")}
              attention
              value={undefined}
              unavailable={unavailable}
            />
          )}
          {investment ? (
            <ProductRow
              href={APP_PATH.MONEY_INVESTMENTS}
              visual={PRODUCT_ROW_VISUAL.investments}
              label={t("productSummary.investments.label")}
              detail={investmentDetail(investment, t)}
              attention={
                investment.valuationQuality !==
                  InvestmentHomeValuationQuality.CURRENT || investmentPartial
              }
              value={
                investment.marketValue == null ? undefined : (
                  <FinancialValue>
                    {money(investment.marketValue, currency, locale)}
                  </FinancialValue>
                )
              }
              unavailable={unavailable}
            />
          ) : (
            <ProductRow
              href={APP_PATH.MONEY_INVESTMENTS}
              visual={PRODUCT_ROW_VISUAL.investments}
              label={t("productSummary.investments.label")}
              detail={t("productSummary.unavailable")}
              attention
              value={undefined}
              unavailable={unavailable}
            />
          )}
          {loans.status === HomeProductReadStatus.READY ? (
            <ProductRow
              href={APP_PATH.MONEY_LOANS}
              visual={PRODUCT_ROW_VISUAL.loans}
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
              unavailable={unavailable}
            />
          ) : (
            <ProductRow
              href={APP_PATH.MONEY_LOANS}
              visual={PRODUCT_ROW_VISUAL.loans}
              label={t("productSummary.loans.label")}
              detail={t("productSummary.unavailable")}
              attention
              value={undefined}
              unavailable={unavailable}
            />
          )}
          {debt.status === HomeProductReadStatus.READY ? (
            <ProductRow
              href={APP_PATH.MONEY_DEBTS}
              visual={PRODUCT_ROW_VISUAL.debt}
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
              unavailable={unavailable}
            />
          ) : (
            <ProductRow
              href={APP_PATH.MONEY_DEBTS}
              visual={PRODUCT_ROW_VISUAL.debt}
              label={t("productSummary.debt.label")}
              detail={t("productSummary.unavailable")}
              attention
              value={undefined}
              unavailable={unavailable}
            />
          )}
        </div>
      </Card>
    </Section>
  );
}
