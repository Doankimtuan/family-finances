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
import { SavingsTermUnit } from "@/modules/savings/application/savings-domain-rules";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { Progress } from "@/shared/ui/progress";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FinancialValue } from "@/shared/patterns/financial-value";
import {
  FINANCE_ICONS,
  SAVINGS_PROVIDER_ICONS,
} from "@/shared/ui/icon-registry";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { RenewalPolicyEditor } from "./renewal-policy-editor";
import { SavingsSettlementFlow } from "./settlement-flow";
import { SavingsCycleHistory } from "./savings-cycle-history";
import { SavingsMaturityBadge } from "../savings-maturity-badge";
import { SavingsPrivacyToggle } from "../savings-privacy-toggle";
import { SavingsSectionTitle } from "../savings-section-title";
import { SavingsFactRow, SavingsFactsCard } from "../savings-facts";
import { SavingsUnavailable } from "../savings-unavailable";

type Props = { params: Promise<{ locale: string; id: string }> };

const DEBIT_SAVINGS_EVENTS = new Set<string>([
  SavingsEventKind.TAX,
  SavingsEventKind.FEE,
]);

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
}

function resolveTermUnitLabel(
  termUnit: string | null | undefined,
  labels: { month: string; day: string },
) {
  if (termUnit === SavingsTermUnit.MONTH) return labels.month;
  if (termUnit === SavingsTermUnit.DAY) return labels.day;
  return "";
}

function resolveActivityAmountTone(kind: string) {
  if (kind === SavingsEventKind.INTEREST) return TransactionAmountTone.CREDIT;
  if (DEBIT_SAVINGS_EVENTS.has(kind)) return TransactionAmountTone.DEBIT;
  return TransactionAmountTone.NEUTRAL;
}

function savingsFamilyIcon(family: SavingsFamily) {
  return family === SavingsFamily.BANK
    ? SAVINGS_PROVIDER_ICONS.bank
    : SAVINGS_PROVIDER_ICONS.smartphone;
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
        <SavingsUnavailable
          title={t("notFound")}
          actionHref={APP_PATH.MONEY_SAVINGS}
          actionLabel={t("back")}
        />
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
  const familyIcon = savingsFamilyIcon(item.savingsFamily);
  const termUnit = cycleSnapshot?.termUnit ?? item.productSnapshot.termUnit;
  const termAmount =
    cycleSnapshot?.termAmount ?? item.productSnapshot.termAmount;
  const termUnitLabel = resolveTermUnitLabel(termUnit, {
    month: t("termMonth"),
    day: t("termDay"),
  });
  const termLabel =
    termAmount && termUnitLabel ? `${termAmount} ${termUnitLabel}` : "—";
  const detailName = item.productName || item.providerName || t("title");
  const fundingAccountName = item.fundingAccountName || t("accountFallback");
  const settlementAccountName =
    item.settlementAccountName || t("accountFallback");
  const selectedTargetPackageName = item.maturityInstruction.targetPackageId
    ? (packages.find(
        (pkg) => pkg.id === item.maturityInstruction.targetPackageId,
      )?.packageName ?? t("keepCurrentPackage"))
    : t("keepCurrentPackage");
  const targetPackageDisplay = targetUnavailable
    ? t("targetUnavailable")
    : selectedTargetPackageName;

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
              <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
                  <AppIcon icon={familyIcon} size={AppIconSize.MD} emphasized />
                </span>
                <Text size="sm" weight="medium" className="text-hero-muted">
                  {t("principalHeroLabel")}
                </Text>
              </div>
              <SavingsPrivacyToggle />
            </div>
            <Amount
              amountLabel={money(model.principal)}
              size={AmountSize.HERO}
              className="mt-(--space-3)"
              amountClassName="text-hero-fg"
            />
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
              aria-label={t("cycleFactsTitle")}
            >
              <div className="flex items-center justify-between gap-(--space-3)">
                <Text size="xs" tone="secondary" className="text-pretty">
                  {t("maturityStateLabel")}
                </Text>
                <SavingsMaturityBadge state={state} label={stateLabel} />
              </div>
              <div className="grid grid-cols-2 gap-(--space-3)">
                <CycleMetric label={t("rateLabel")}>
                  {formatPercent(cycle.lockedRate / 100, locale, {
                    maximumFractionDigits: 2,
                  })}
                </CycleMetric>
                <CycleMetric label={t("termLabel")}>{termLabel}</CycleMetric>
                <CycleMetric label={t("startDateLabel")}>
                  {formatIsoDate(cycle.startDate, locale)}
                </CycleMetric>
              </div>
              <dl
                className="flex flex-col gap-(--space-1) border-t border-divider pt-(--space-3)"
                data-testid="savings-expected-return"
              >
                <SavingsFactRow
                  label={t("expectedGrossInterestLabel")}
                  value={
                    <FinancialValue>
                      {money(model.grossInterest)}
                    </FinancialValue>
                  }
                  className="px-0 py-(--space-1)"
                />
                {model.tax > 0 ? (
                  <SavingsFactRow
                    label={t("expectedTaxLabel")}
                    value={<FinancialValue>{money(model.tax)}</FinancialValue>}
                    className="px-0 py-(--space-1)"
                  />
                ) : null}
                <SavingsFactRow
                  label={t("expectedNetInterestLabel")}
                  value={
                    <FinancialValue>{money(model.netInterest)}</FinancialValue>
                  }
                  className="px-0 py-(--space-1)"
                />
                <div className="border-t border-divider pt-(--space-2)">
                  <SavingsFactRow
                    label={t("expectedReceivedLabel")}
                    value={
                      <FinancialValue>
                        {money(model.totalCashReceived)}
                      </FinancialValue>
                    }
                    emphasis
                    className="px-0 py-(--space-1)"
                  />
                </div>
              </dl>
              <Text size="xs" tone="muted" className="text-pretty">
                {t("expectedValueHint")}
              </Text>
            </Card>
          ) : null}
        </section>
      </MotionReveal>

      {cycle && model.totalTermDays && model.elapsedDays != null ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="savings-term-progress"
        >
          <SavingsSectionTitle>{t("progressLabel")}</SavingsSectionTitle>
          <Card tone="elevated" className="gap-(--space-2) p-(--space-4)">
            <Progress
              value={Math.min(model.elapsedDays, model.totalTermDays)}
              max={model.totalTermDays}
              label={t("progressLabel")}
              showLabel={false}
              tone={IconContainerTone.SAVINGS}
            />
            <div className="flex items-center justify-between gap-(--space-3)">
              <Text size="xs" tone="secondary">
                {formatIsoDate(cycle.startDate, locale)}
              </Text>
              <Text size="xs" weight="medium" className="text-center">
                {t("progressDays", {
                  elapsed: Math.min(model.elapsedDays, model.totalTermDays),
                  total: model.totalTermDays,
                })}
              </Text>
              <Text size="xs" tone="secondary">
                {formatIsoDate(cycle.endDate, locale)}
              </Text>
            </div>
          </Card>
        </section>
      ) : null}

      <SavingsFactsCard
        title={t("productDetailsTitle")}
        testId="savings-product-details"
        footer={
          <Text
            size="xs"
            tone="muted"
            className="border-t border-divider px-(--space-4) py-(--space-3) text-pretty"
          >
            {tProducts("notBankBalance")}
          </Text>
        }
      >
        <SavingsFactRow
          label={t("providerLabel")}
          value={item.providerName || t("title")}
        />
        <SavingsFactRow label={t("familyLabel")} value={familyLabel} />
        <SavingsFactRow label={t("termLabel")} value={termLabel} />
        <SavingsFactRow label={t("currencyLabel")} value={currency} />
      </SavingsFactsCard>

      <section
        className="flex flex-col gap-(--space-2)"
        data-testid="savings-money-flow"
      >
        <SavingsSectionTitle>{t("moneyFlowTitle")}</SavingsSectionTitle>
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <div className="flex items-start gap-(--space-3) px-(--space-4) py-(--space-3)">
            <IconContainer tone={IconContainerTone.NEUTRAL} size="sm">
              <AppIcon icon={FINANCE_ICONS.wallet} size={AppIconSize.SM} />
            </IconContainer>
            <div className="min-w-0 flex-1">
              <Text size="xs" tone="secondary">
                {t("fundingAccountLabel")}
              </Text>
              <Text size="sm" weight="medium" className="text-pretty">
                {historicalOpening
                  ? t("historicalOpeningFlowLine")
                  : fundingAccountName}
              </Text>
            </div>
          </div>
          <div className="flex items-start gap-(--space-3) border-t border-divider px-(--space-4) py-(--space-3)">
            <IconContainer tone={IconContainerTone.SAVINGS} size="sm">
              <AppIcon icon={FINANCE_ICONS.income} size={AppIconSize.SM} />
            </IconContainer>
            <div className="min-w-0 flex-1">
              <Text size="xs" tone="secondary">
                {t("settlementAccountLabel")}
              </Text>
              <Text size="sm" weight="medium" className="text-pretty">
                {settlementAccountName}
              </Text>
            </div>
          </div>
        </Card>
      </section>

      {canAct ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="savings-maturity-instruction"
        >
          <SavingsSectionTitle>
            {t("maturityInstructionTitle")}
          </SavingsSectionTitle>
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <Text
              size="xs"
              tone="secondary"
              className="px-(--space-4) pt-(--space-3) text-pretty"
            >
              {t("renewalPolicyHint")}
            </Text>
            <dl className="divide-y divide-divider">
              <SavingsFactRow
                label={t("maturityStrategyLabel")}
                value={t(
                  `settlementRules.${item.maturityInstruction.strategy}` as never,
                )}
              />
              {item.maturityInstruction.strategy !==
              SettlementRule.WITHDRAW_EVERYTHING ? (
                <SavingsFactRow
                  label={t("targetPackageLabel")}
                  value={targetPackageDisplay}
                />
              ) : null}
            </dl>
            <div className="border-t border-divider px-(--space-4) py-(--space-3)">
              <RenewalPolicyEditor
                savingId={item.id}
                renewalPolicy={item.renewalPolicy}
                renewalConfig={item.renewalConfig}
                packages={packages}
                accounts={accounts}
              />
            </div>
          </Card>
        </section>
      ) : null}

      {cycles && cycles.length > 0 ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="savings-cycle-history"
        >
          <div>
            <SavingsSectionTitle>{t("historyTitle")}</SavingsSectionTitle>
            <Text
              size="xs"
              tone="secondary"
              className="mt-(--space-1) text-pretty"
            >
              {t("historyCaption")}
            </Text>
          </div>
          <Card tone="elevated" className="gap-0 overflow-hidden p-(--space-4)">
            <SavingsCycleHistory cycles={cycles} currency={currency} />
          </Card>
        </section>
      ) : null}

      <section
        className="flex flex-col gap-(--space-2)"
        data-testid="savings-financial-activity"
      >
        <div>
          <SavingsSectionTitle>{t("activityTitle")}</SavingsSectionTitle>
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-1) text-pretty"
          >
            {t("activityHint")}
          </Text>
        </div>
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
              {activities.map((activity) => (
                <TransactionRow
                  key={activity.id}
                  title={t(`activity.${activity.eventKind}` as never)}
                  subtitle={formatDate(new Date(activity.date), locale)}
                  amountLabel={money(activity.amount)}
                  tone={resolveActivityAmountTone(activity.eventKind)}
                  showRail={false}
                  className="last:border-b-0"
                />
              ))}
            </div>
          </Card>
        ) : (
          <Card
            tone="soft"
            className="flex flex-col items-center gap-(--space-2) p-(--space-4)"
          >
            <IconContainer tone={IconContainerTone.SAVINGS} size="sm">
              <AppIcon icon={FINANCE_ICONS.savings} size={AppIconSize.SM} />
            </IconContainer>
            <Text size="sm" weight="medium" className="text-center">
              {t("activityEmpty")}
            </Text>
            <Text
              size="xs"
              tone="secondary"
              className="text-center text-pretty"
            >
              {t("activityEmptyHint")}
            </Text>
          </Card>
        )}
      </section>

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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
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
