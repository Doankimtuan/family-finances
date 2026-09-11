import { Suspense, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
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
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { Card } from "@/shared/patterns/card";
import { Section } from "@/shared/patterns/section";
import { Text } from "@/shared/ui/text";
import { Skeleton } from "@/shared/ui/skeleton";
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

type StreamingProps = Omit<
  Props,
  "savings" | "investments" | "loans" | "debt"
> & {
  savings: Promise<HomeProductReadResult<HomeSavingsSummary>>;
  investments: Promise<HomeProductReadResult<HomeInvestmentSummary>>;
  loans: Promise<HomeProductReadResult<HomeLoanSummary>>;
  debt: Promise<HomeProductReadResult<HomeDebtSummary>>;
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
  kind,
  testId,
}: {
  href: string;
  visual: ProductVisual;
  label: string;
  detail: string;
  attention: boolean;
  value?: ReactNode;
  unavailable: string;
  kind?: (typeof FinancialNumberKind)[keyof typeof FinancialNumberKind];
  testId?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={PRODUCT_LINK_PREFETCH}
      className={PRODUCT_ROW_CLASS}
      data-testid={testId}
    >
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
            weight={
              kind === FinancialNumberKind.ESTIMATE ? "medium" : "semibold"
            }
            tabular
            className="tracking-tight text-text-primary"
            data-financial-kind={kind}
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

type ProductRowContentProps = Omit<
  Props,
  "savings" | "investments" | "loans" | "debt"
> & {
  testId?: string;
};

function SavingsProductRowContent({
  result,
  locale,
  currency,
  t,
  testId,
}: ProductRowContentProps & { result: Props["savings"] }) {
  const unavailable = t("common.unavailable");

  return result.status === HomeProductReadStatus.READY ? (
    <ProductRow
      href={APP_PATH.MONEY_SAVINGS}
      visual={PRODUCT_ROW_VISUAL.savings}
      testId={testId}
      label={t("productSummary.savings.label")}
      detail={
        result.summary.actionRequiredCount > 0
          ? t("productSummary.savings.attention", {
              count: result.summary.actionRequiredCount,
            })
          : t("productSummary.savings.detail", {
              count: result.summary.activeCount,
            })
      }
      attention={result.summary.actionRequiredCount > 0}
      value={
        <FinancialValue>
          {money(result.summary.principal, currency, locale)}
        </FinancialValue>
      }
      kind={FinancialNumberKind.CURRENT_STATE}
      unavailable={unavailable}
    />
  ) : (
    <ProductRow
      href={APP_PATH.MONEY_SAVINGS}
      visual={PRODUCT_ROW_VISUAL.savings}
      testId={testId}
      label={t("productSummary.savings.label")}
      detail={t("productSummary.unavailable")}
      attention
      value={undefined}
      unavailable={unavailable}
    />
  );
}

function InvestmentProductRowContent({
  result,
  locale,
  currency,
  t,
  testId,
}: ProductRowContentProps & { result: Props["investments"] }) {
  const unavailable = t("common.unavailable");
  if (result.status !== HomeProductReadStatus.READY) {
    return (
      <ProductRow
        href={APP_PATH.MONEY_INVESTMENTS}
        visual={PRODUCT_ROW_VISUAL.investments}
        testId={testId}
        label={t("productSummary.investments.label")}
        detail={t("productSummary.unavailable")}
        attention
        value={undefined}
        unavailable={unavailable}
      />
    );
  }

  const investmentPartial =
    result.summary.valuationIncluded < result.summary.valuationTotal;
  return (
    <ProductRow
      href={APP_PATH.MONEY_INVESTMENTS}
      visual={PRODUCT_ROW_VISUAL.investments}
      testId={testId}
      label={t("productSummary.investments.label")}
      detail={investmentDetail(result.summary, t)}
      attention={
        result.summary.valuationQuality !==
          InvestmentHomeValuationQuality.CURRENT || investmentPartial
      }
      value={
        result.summary.marketValue == null ? undefined : (
          <FinancialValue>
            {money(result.summary.marketValue, currency, locale)}
          </FinancialValue>
        )
      }
      kind={FinancialNumberKind.ESTIMATE}
      unavailable={unavailable}
    />
  );
}

function LoanProductRowContent({
  result,
  locale,
  currency,
  t,
  testId,
}: ProductRowContentProps & { result: Props["loans"] }) {
  const unavailable = t("common.unavailable");
  if (result.status !== HomeProductReadStatus.READY) {
    return (
      <ProductRow
        href={APP_PATH.MONEY_LOANS}
        visual={PRODUCT_ROW_VISUAL.loans}
        testId={testId}
        label={t("productSummary.loans.label")}
        detail={t("productSummary.unavailable")}
        attention
        value={undefined}
        unavailable={unavailable}
      />
    );
  }

  return (
    <ProductRow
      href={APP_PATH.MONEY_LOANS}
      visual={PRODUCT_ROW_VISUAL.loans}
      testId={testId}
      label={t("productSummary.loans.label")}
      detail={
        result.summary.attentionCount > 0
          ? t("productSummary.loans.attention", {
              count: result.summary.attentionCount,
            })
          : t("productSummary.loans.detail", {
              count: result.summary.activeCount,
            })
      }
      attention={result.summary.attentionCount > 0}
      value={
        <FinancialValue>
          {money(result.summary.remainingPrincipal, currency, locale)}
        </FinancialValue>
      }
      kind={FinancialNumberKind.CURRENT_STATE}
      unavailable={unavailable}
    />
  );
}

function DebtProductRowContent({
  result,
  locale,
  currency,
  t,
  testId,
}: ProductRowContentProps & { result: Props["debt"] }) {
  const unavailable = t("common.unavailable");
  if (result.status !== HomeProductReadStatus.READY) {
    return (
      <ProductRow
        href={APP_PATH.MONEY_DEBTS}
        visual={PRODUCT_ROW_VISUAL.debt}
        testId={testId}
        label={t("productSummary.debt.label")}
        detail={t("productSummary.unavailable")}
        attention
        value={undefined}
        unavailable={unavailable}
      />
    );
  }

  return (
    <ProductRow
      href={APP_PATH.MONEY_DEBTS}
      visual={PRODUCT_ROW_VISUAL.debt}
      testId={testId}
      label={t("productSummary.debt.label")}
      detail={
        result.summary.attentionCount > 0
          ? t("productSummary.debt.attention", {
              count: result.summary.attentionCount,
            })
          : t("productSummary.debt.detail", {
              count: result.summary.activeCount,
            })
      }
      attention={result.summary.attentionCount > 0}
      value={
        <FinancialValue>
          {money(
            result.summary.borrowedRemaining + result.summary.lentRemaining,
            currency,
            locale,
          )}
        </FinancialValue>
      }
      kind={FinancialNumberKind.CURRENT_STATE}
      unavailable={unavailable}
    />
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
  return (
    <Section
      title={t("productSummary.title")}
      description={t("productSummary.hint")}
      testId={HOME_TEST_ID.PRODUCT_SUMMARIES}
    >
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          <SavingsProductRowContent
            locale={locale}
            currency={currency}
            result={savings}
            t={t}
          />
          <InvestmentProductRowContent
            locale={locale}
            currency={currency}
            result={investments}
            t={t}
          />
          <LoanProductRowContent
            locale={locale}
            currency={currency}
            result={loans}
            t={t}
          />
          <DebtProductRowContent
            locale={locale}
            currency={currency}
            result={debt}
            t={t}
          />
        </div>
      </Card>
    </Section>
  );
}

export function ProductRowSkeleton() {
  return (
    <div
      className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2)"
      aria-hidden
    >
      <Skeleton className="size-8 shrink-0 rounded-(--radius-control)" />
      <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="size-4 shrink-0" />
    </div>
  );
}

async function SavingsProductRow({
  result,
  locale,
  currency,
  t,
}: {
  result: StreamingProps["savings"];
  locale: string;
  currency: string;
  t: Props["t"];
}) {
  return (
    <SavingsProductRowContent
      result={await result}
      locale={locale}
      currency={currency}
      t={t}
      testId={HOME_TEST_ID.PRODUCT_SAVINGS}
    />
  );
}

async function InvestmentProductRow({
  result,
  locale,
  currency,
  t,
}: {
  result: StreamingProps["investments"];
  locale: string;
  currency: string;
  t: Props["t"];
}) {
  return (
    <InvestmentProductRowContent
      result={await result}
      locale={locale}
      currency={currency}
      t={t}
      testId={HOME_TEST_ID.PRODUCT_INVESTMENTS}
    />
  );
}

async function LoanProductRow({
  result,
  locale,
  currency,
  t,
}: {
  result: StreamingProps["loans"];
  locale: string;
  currency: string;
  t: Props["t"];
}) {
  return (
    <LoanProductRowContent
      result={await result}
      locale={locale}
      currency={currency}
      t={t}
      testId={HOME_TEST_ID.PRODUCT_LOANS}
    />
  );
}

async function DebtProductRow({
  result,
  locale,
  currency,
  t,
}: {
  result: StreamingProps["debt"];
  locale: string;
  currency: string;
  t: Props["t"];
}) {
  return (
    <DebtProductRowContent
      result={await result}
      locale={locale}
      currency={currency}
      t={t}
      testId={HOME_TEST_ID.PRODUCT_DEBT}
    />
  );
}

export function HomeProductSummariesStreaming({
  locale,
  currency,
  savings,
  investments,
  loans,
  debt,
  t,
}: StreamingProps) {
  return (
    <Section
      title={t("productSummary.title")}
      description={t("productSummary.hint")}
      testId={HOME_TEST_ID.PRODUCT_SUMMARIES}
    >
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          <Suspense fallback={<ProductRowSkeleton />}>
            <SavingsProductRow
              result={savings}
              locale={locale}
              currency={currency}
              t={t}
            />
          </Suspense>
          <Suspense fallback={<ProductRowSkeleton />}>
            <InvestmentProductRow
              result={investments}
              locale={locale}
              currency={currency}
              t={t}
            />
          </Suspense>
          <Suspense fallback={<ProductRowSkeleton />}>
            <LoanProductRow
              result={loans}
              locale={locale}
              currency={currency}
              t={t}
            />
          </Suspense>
          <Suspense fallback={<ProductRowSkeleton />}>
            <DebtProductRow
              result={debt}
              locale={locale}
              currency={currency}
              t={t}
            />
          </Suspense>
        </div>
      </Card>
    </Section>
  );
}
