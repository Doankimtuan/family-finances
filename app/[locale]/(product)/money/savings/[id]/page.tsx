import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneySavingsEarlyWithdrawPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getSaving,
  listSavingCycles,
  listProviderPackages,
  listSavingsFinancialActivities,
  listSavingsEligibleAccounts,
  buildSavingsDetailModel,
  SavingsEventKind,
  SavingsFamily,
  SavingStatus,
  SettlementRule,
  SavingsCreateMode,
} from "@/modules/savings/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { Progress } from "@/shared/ui/progress";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainerTone } from "@/shared/ui/icon-container";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { RenewalPolicyEditor } from "./renewal-policy-editor";
import { SavingsSettlementFlow } from "./settlement-flow";
import { SavingsCycleHistory } from "./savings-cycle-history";
import { SavingsMaturityBadge } from "../savings-maturity-badge";
import { BankIcon, SmartPhoneIcon } from "@hugeicons/core-free-icons";

type Props = { params: Promise<{ locale: string; id: string }> };

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
}

function CycleMetric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Text size="xs" tone="secondary" className="text-pretty">
        {label}
      </Text>
      <Text
        size="sm"
        weight="semibold"
        tabular
        className="mt-(--space-1) text-pretty text-text-primary"
      >
        {children}
      </Text>
    </div>
  );
}

function FactRow({
  label,
  children,
  emphasis = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-(--space-3)">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <Text
        size="sm"
        weight={emphasis ? "semibold" : "medium"}
        tabular={emphasis}
        className="text-right text-text-primary"
      >
        {children}
      </Text>
    </div>
  );
}

export default async function SavingsDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id)))
    return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, tProducts, item, cycles] = await Promise.all([
    getTranslations("money.savingsDetail"),
    getTranslations("money.products"),
    getSaving(id),
    listSavingCycles(id),
  ]);
  if (!item) {
    return (
      <Page
        testId="savings-detail-missing"
        topBar={
          <TopAppBar
            variant="detail"
            backHref={APP_PATH.MONEY_SAVINGS}
            title={t("title")}
          />
        }
      >
        <EmptyState
          title={t("notFound")}
          className="flex-none py-(--space-4)"
        />
        <Link
          href={APP_PATH.MONEY_SAVINGS}
          className="text-sm font-medium text-accent"
        >
          {t("back")}
        </Link>
      </Page>
    );
  }

  const model = buildSavingsDetailModel(item);
  const cycle = item.latestCycle;
  const canMutate = item.ownership.canMutate;
  const canAct =
    canMutate &&
    (item.status === SavingStatus.ACTIVE ||
      item.status === SavingStatus.MATURED);
  const [activities, packagesResult, accountsResult] = await Promise.all([
    listSavingsFinancialActivities(id, cycles ?? []),
    canAct ? listProviderPackages(item.providerId) : Promise.resolve(null),
    canAct ? listSavingsEligibleAccounts() : Promise.resolve(null),
  ]);
  const cycleSnapshot = cycle?.packageSnapshot;
  const legacyImport = Boolean(
    (item.productSnapshot as { legacyImport?: boolean }).legacyImport,
  );
  const historicalOpening =
    item.productSnapshot.creationMode === SavingsCreateMode.HISTORICAL_OPENING;
  const currency =
    cycleSnapshot?.currency ??
    item.productSnapshot.currency ??
    DEFAULT_CURRENCY;
  const money = (value: number) =>
    formatCurrency(value, currency, locale, { maximumFractionDigits: 0 });
  const isTerminal = model.isTerminal;
  const packages = canAct
    ? (packagesResult ?? []).map((pkg) => ({
        id: pkg.id,
        packageName: pkg.packageName,
        durationDays: pkg.durationDays,
        annualInterestRate: pkg.annualInterestRate,
        termAmount: pkg.termAmount,
        termUnit: pkg.termUnit,
      }))
    : [];
  const targetUnavailable = item.maturityActionRequired === true;
  const accounts =
    accountsResult?.accounts.map((account) => ({
      id: account.id,
      name: account.name,
    })) ?? [];
  const state = model.maturityState;
  const stateLabel = t(`maturityStates.${state}`);
  const familyLabel = t(`family.${item.savingsFamily}`);
  const familyIcon =
    item.savingsFamily === SavingsFamily.BANK ? BankIcon : SmartPhoneIcon;
  const termUnit = cycleSnapshot?.termUnit ?? item.productSnapshot.termUnit;
  const termAmount =
    cycleSnapshot?.termAmount ?? item.productSnapshot.termAmount;
  const termUnitLabel =
    termUnit === "MONTH"
      ? t("termMonth")
      : termUnit === "DAY"
        ? t("termDay")
        : "";
  const termLabel =
    termAmount && termUnitLabel ? `${termAmount} ${termUnitLabel}` : "—";
  const detailName = item.productName || item.providerName || t("title");

  return (
    <Page
      testId="savings-detail"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_SAVINGS}
          title={detailName}
          subtitle={familyLabel}
        />
      }
    >
      <MoneyOfflineBanner />
      {legacyImport ? (
        <StatusAlert variant="info" title={t("legacyBanner")} />
      ) : null}
      {historicalOpening ? (
        <Text
          size="xs"
          tone="muted"
          data-testid="savings-added-between-periods"
        >
          {t("addedBetweenPeriods")}
        </Text>
      ) : null}
      {targetUnavailable ? (
        <StatusAlert
          variant="warning"
          title={t("targetUnavailable")}
          description={t("targetUnavailableHint")}
        />
      ) : null}
      <MotionReveal>
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="savings-identity"
        >
          <Card tone="hero" className="gap-0 p-(--space-4)">
            <div className="flex items-center gap-(--space-3)">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
                <AppIcon icon={familyIcon} size="md" emphasized />
              </span>
              <Text size="sm" weight="medium" className="text-hero-muted">
                {t("principalHeroLabel")}
              </Text>
            </div>
            <p className="mt-(--space-3) font-semibold tabular-nums tracking-tight text-3xl text-hero-fg">
              <FinancialValue>{money(model.principal)}</FinancialValue>
            </p>
            <div className="mt-(--space-4) flex flex-col gap-(--space-2) border-t border-white/15 pt-(--space-3)">
              <div className="flex flex-wrap items-center justify-between gap-(--space-2)">
                <FinancialOwnershipBadge
                  financialScope={item.ownership.financialScope}
                  isOwnedByMe={item.ownership.isOwnedByMe}
                  ownerStatus={item.ownership.ownerStatus}
                  onHero
                />
                {cycle ? (
                  <Text size="xs" className="text-pretty text-hero-muted">
                    {t("maturityDate", {
                      date: formatIsoDate(cycle.endDate, locale),
                    })}
                    {model.daysUntilMaturity != null &&
                    model.daysUntilMaturity >= 0
                      ? ` · ${t("daysRemaining", { days: model.daysUntilMaturity })}`
                      : ""}
                  </Text>
                ) : null}
              </div>
            </div>
          </Card>
          {cycle ? (
            <Card
              tone="elevated"
              className="gap-(--space-3) p-(--space-4)"
              data-testid="savings-cycle-facts"
            >
              <div className="grid grid-cols-2 gap-(--space-3)">
                <CycleMetric label={t("rateLabel")}>
                  {formatPercent(cycle.lockedRate / 100, locale, {
                    maximumFractionDigits: 2,
                  })}
                </CycleMetric>
                <CycleMetric label={t("termLabel")}>{termLabel}</CycleMetric>
                <CycleMetric label={t("maturityStateLabel")}>
                  <SavingsMaturityBadge state={state} label={stateLabel} />
                </CycleMetric>
                <CycleMetric label={t("startDateLabel")}>
                  {formatIsoDate(cycle.startDate, locale)}
                </CycleMetric>
              </div>
              <div
                className="flex flex-col gap-(--space-2) border-t border-divider pt-(--space-3)"
                data-testid="savings-expected-return"
              >
                <FactRow label={t("expectedGrossInterestLabel")}>
                  <FinancialValue>{money(model.grossInterest)}</FinancialValue>
                </FactRow>
                {model.tax > 0 ? (
                  <FactRow label={t("expectedTaxLabel")}>
                    <FinancialValue>{money(model.tax)}</FinancialValue>
                  </FactRow>
                ) : null}
                <FactRow label={t("expectedNetInterestLabel")}>
                  <FinancialValue>{money(model.netInterest)}</FinancialValue>
                </FactRow>
                <div className="border-t border-divider pt-(--space-2)">
                  <FactRow label={t("expectedReceivedLabel")} emphasis>
                    <FinancialValue>
                      {money(model.totalCashReceived)}
                    </FinancialValue>
                  </FactRow>
                </div>
                <Text size="xs" tone="muted" className="text-pretty">
                  {t("expectedValueHint")}
                </Text>
              </div>
            </Card>
          ) : null}
        </section>
      </MotionReveal>

      {cycle && model.totalTermDays && model.elapsedDays != null ? (
        <MotionReveal>
          <Section testId="savings-term-progress">
            <Progress
              value={Math.min(model.elapsedDays, model.totalTermDays)}
              max={model.totalTermDays}
              label={t("progressLabel")}
              showLabel={false}
              tone={IconContainerTone.SAVINGS}
            />
            <div className="mt-(--space-2) flex items-center justify-between gap-(--space-3)">
              <Text size="xs" tone="secondary">
                {formatIsoDate(cycle.startDate, locale)}
              </Text>
              <Text size="xs" weight="medium">
                {t("progressDays", {
                  elapsed: Math.min(model.elapsedDays, model.totalTermDays),
                  total: model.totalTermDays,
                })}
              </Text>
              <Text size="xs" tone="secondary">
                {formatIsoDate(cycle.endDate, locale)}
              </Text>
            </div>
          </Section>
        </MotionReveal>
      ) : null}

      <Section
        title={t("productDetailsTitle")}
        testId="savings-product-details"
      >
        <dl className="divide-y divide-border-subtle/70">
          <div className="flex justify-between gap-(--space-3) py-(--space-2)">
            <dt className="text-sm text-text-secondary">
              {t("providerLabel")}
            </dt>
            <dd className="text-sm font-medium">
              {item.providerName || t("title")}
            </dd>
          </div>
          <div className="flex justify-between gap-(--space-3) py-(--space-2)">
            <dt className="text-sm text-text-secondary">{t("familyLabel")}</dt>
            <dd className="text-sm font-medium">{familyLabel}</dd>
          </div>
          <div className="flex justify-between gap-(--space-3) py-(--space-2)">
            <dt className="text-sm text-text-secondary">{t("termLabel")}</dt>
            <dd className="text-sm font-medium">{termLabel}</dd>
          </div>
          <div className="flex justify-between gap-(--space-3) py-(--space-2)">
            <dt className="text-sm text-text-secondary">
              {t("currencyLabel")}
            </dt>
            <dd className="text-sm font-medium">{currency}</dd>
          </div>
        </dl>
        <Text size="xs" tone="muted" className="mt-(--space-2) text-pretty">
          {tProducts("notBankBalance")}
        </Text>
      </Section>

      <Section title={t("moneyFlowTitle")} testId="savings-money-flow">
        <div className="grid gap-(--space-2)">
          <Text size="sm" tone="secondary">
            {historicalOpening
              ? t("historicalOpeningFlowLine")
              : t("fundingAccountLine", {
                  account: item.fundingAccountName || t("accountFallback"),
                })}
          </Text>
          <Text size="sm" tone="secondary">
            {t("settlementAccountLine", {
              account: item.settlementAccountName || t("accountFallback"),
            })}
          </Text>
        </div>
      </Section>

      {canAct ? (
        <Section
          title={t("maturityInstructionTitle")}
          testId="savings-maturity-instruction"
        >
          <Text size="sm" tone="secondary">
            {t("renewalPolicyHint")}
          </Text>
          <div className="mt-(--space-3) grid gap-(--space-2)">
            <Text size="sm" weight="semibold">
              {t("maturityStrategyLabel")}:{" "}
              {t(
                `settlementRules.${item.maturityInstruction.strategy}` as never,
              )}
            </Text>
            {item.maturityInstruction.strategy !==
            SettlementRule.WITHDRAW_EVERYTHING ? (
              <Text size="sm" tone="secondary">
                {t("targetPackageLabel")}:{" "}
                {targetUnavailable
                  ? t("targetUnavailable")
                  : item.maturityInstruction.targetPackageId
                    ? (packages.find(
                        (pkg) =>
                          pkg.id === item.maturityInstruction.targetPackageId,
                      )?.packageName ?? t("keepCurrentPackage"))
                    : t("keepCurrentPackage")}
              </Text>
            ) : null}
          </div>
          <div className="mt-(--space-3)">
            <RenewalPolicyEditor
              savingId={item.id}
              renewalPolicy={item.renewalPolicy}
              renewalConfig={item.renewalConfig}
              packages={packages}
              accounts={accounts}
            />
          </div>
        </Section>
      ) : null}

      {cycles && cycles.length > 0 ? (
        <Section title={t("historyTitle")} testId="savings-cycle-history">
          <Text size="sm" tone="secondary">
            {t("historyCaption")}
          </Text>
          <div className="mt-(--space-2)">
            <SavingsCycleHistory cycles={cycles} currency={currency} />
          </div>
        </Section>
      ) : null}

      <Section
        title={t("activityTitle")}
        description={t("activityHint")}
        testId="savings-financial-activity"
      >
        {activities && activities.length > 0 ? (
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between gap-(--space-3) border-b border-border-subtle px-(--space-4) py-(--space-3)">
              <Text size="xs" weight="medium" tone="secondary">
                {t("activityCount", { count: activities.length })}
              </Text>
              <Text size="xs" tone="muted">
                {t("activityReadOnly")}
              </Text>
            </div>
            <div className="px-(--space-4)">
              {activities.map((activity) => {
                const tone =
                  activity.eventKind === SavingsEventKind.INTEREST
                    ? TransactionAmountTone.CREDIT
                    : activity.eventKind === SavingsEventKind.TAX ||
                        activity.eventKind === SavingsEventKind.FEE
                      ? TransactionAmountTone.DEBIT
                      : TransactionAmountTone.NEUTRAL;
                return (
                  <TransactionRow
                    key={activity.id}
                    title={t(`activity.${activity.eventKind}` as never)}
                    subtitle={formatDate(new Date(activity.date), locale)}
                    amountLabel={money(activity.amount)}
                    tone={tone}
                    showRail={false}
                    className="last:border-b-0"
                  />
                );
              })}
            </div>
          </Card>
        ) : (
          <Card tone="soft" className="gap-(--space-1) p-(--space-4)">
            <Text size="sm" weight="medium">
              {t("activityEmpty")}
            </Text>
            <Text size="xs" tone="secondary">
              {t("activityEmptyHint")}
            </Text>
          </Card>
        )}
      </Section>

      {isTerminal ? (
        <StatusAlert variant="info" title={t("terminalReadOnly")} />
      ) : null}

      <BottomActionBar>
        {model.canSettle && cycle ? (
          accounts.length > 0 ? (
            <SavingsSettlementFlow
              cycleId={cycle.id}
              currentPackageId={
                cycle.packageSnapshot.packageId ??
                item.productSnapshot.packageId ??
                null
              }
              currentMaturityDate={cycle.endDate}
              principal={model.principal}
              grossInterest={model.grossInterest}
              taxRule={model.taxRule}
              taxRatePercent={model.taxRatePercent}
              fee={model.fee}
              settlementAccountId={item.settlementAccountId}
              accounts={accounts}
              packages={packages}
              currency={currency}
              targetUnavailable={targetUnavailable}
            />
          ) : (
            <Text size="sm" tone="secondary">
              {t("noSettlementYet")}
            </Text>
          )
        ) : null}
        {model.canSettleEarly ? (
          <Link
            href={moneySavingsEarlyWithdrawPath(item.id)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
            data-testid="savings-early-withdraw"
          >
            {t("earlyWithdraw")}
          </Link>
        ) : null}
        {!model.canSettle && !model.canSettleEarly && !isTerminal ? (
          <Text size="sm" tone="secondary">
            {t("noSettlementYet")}
          </Text>
        ) : null}
      </BottomActionBar>
    </Page>
  );
}
