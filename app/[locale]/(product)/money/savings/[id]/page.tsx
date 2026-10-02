import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneySavingsEarlyWithdrawPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import {
  getSavingDetail,
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
import { RenewalPolicy } from "@/modules/savings/application/savings-constants";
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
  UTILITY_ICONS,
  ACTION_ICONS,
  SAVINGS_PROVIDER_ICONS,
} from "@/shared/ui/icon-registry";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { RenewalPolicyEditor } from "./renewal-policy-editor";
import { SavingsSettlementFlow } from "./settlement-flow";
import { SavingsCycleHistory } from "./savings-cycle-history";
import { SavingsMaturityBadge } from "../savings-maturity-badge";
import { SavingsPrivacyToggle } from "../savings-privacy-toggle";
import { SavingsSectionTitle } from "../savings-section-title";
import { SavingsFactRow } from "../savings-facts";
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

export default async function SavingsDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const { user, membership } = await getSessionMembership();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, tProducts, detail] = await Promise.all([
    getTranslations("money.savingsDetail"),
    getTranslations("money.products"),
    getSavingDetail(id),
  ]);
  const item = detail?.saving ?? null;
  const cycles = detail?.cycles ?? null;
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
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_SAVINGS}
          title={t("detailTitle")}
          trailing={<SavingsPrivacyToggle onHero={false} />}
          className="border-b border-divider [&_[data-slot=header-title]]:block [&_[data-slot=header-title]]:text-center [&_[data-slot=header-title]]:text-base"
        />
      }
    >
      <MoneyOfflineBanner />
      {legacyImport ? (
        <StatusAlert variant="info" title={t("legacyBanner")} />
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
          <Card
            tone="elevated"
            className="gap-0 p-(--space-4)"
            data-financial-object="savings"
          >
            <div className="flex min-w-0 items-start gap-(--space-3)">
              <IconContainer tone={IconContainerTone.SAVINGS} size="md">
                <AppIcon icon={familyIcon} size={AppIconSize.MD} emphasized />
              </IconContainer>
              <div className="min-w-0 flex-1">
                <Text size="sm" weight="semibold" className="text-pretty">
                  {detailName}
                </Text>
                <Text size="xs" tone="secondary" className="mt-(--space-1)">
                  {item.providerName || t("title")} · {familyLabel}
                </Text>
              </div>
              <FinancialOwnershipBadge
                financialScope={item.ownership.financialScope}
                isOwnedByMe={item.ownership.isOwnedByMe}
                ownerStatus={item.ownership.ownerStatus}
                className="px-(--space-3) py-(--space-1-5)"
              />
            </div>
            <div className="mt-(--space-3) border-t border-divider pt-(--space-3)">
              <div className="flex flex-wrap items-center justify-between gap-(--space-2)">
                <Text size="xs" weight="medium" tone="secondary">
                  {t("principalHeroLabel")}
                </Text>
                <SavingsMaturityBadge state={state} label={stateLabel} />
              </div>
              <Amount
                amountLabel={money(model.principal)}
                size={AmountSize.HERO}
                className="mt-(--space-1)"
                amountClassName="text-text-primary"
              />
              {historicalOpening ? (
                <Text
                  size="xs"
                  tone="muted"
                  className="mt-(--space-1)"
                  data-testid="savings-added-between-periods"
                >
                  {t("addedBetweenPeriods")}
                </Text>
              ) : null}
              <div className="mt-(--space-4) grid grid-cols-2 items-stretch gap-(--space-2)">
                <div className="min-w-0 rounded-(--radius-control) border border-border-subtle bg-surface-muted p-(--space-3)">
                  <Text
                    size="xs"
                    tone="secondary"
                    className="min-h-8 text-pretty leading-snug"
                  >
                    {t("accruedNonPostedLabel")}
                  </Text>
                  <Text
                    size="sm"
                    weight="semibold"
                    tabular
                    className="mt-(--space-1) text-success"
                  >
                    <FinancialValue>
                      {money(model.grossInterest)}
                    </FinancialValue>
                  </Text>
                </div>
                <div className="min-w-0 rounded-(--radius-control) border border-border-subtle bg-surface-muted p-(--space-3)">
                  <Text
                    size="xs"
                    tone="secondary"
                    className="min-h-8 text-pretty leading-snug"
                  >
                    {t("rateLabel")}
                  </Text>
                  {cycle ? (
                    <Text
                      size="sm"
                      weight="semibold"
                      tabular
                      className="mt-(--space-1) text-primary"
                    >
                      {formatPercent(cycle.lockedRate / 100, locale, {
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  ) : (
                    <Text
                      size="sm"
                      weight="semibold"
                      className="mt-(--space-1)"
                    >
                      {t("unknown")}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>
      </MotionReveal>

      {cycle && model.totalTermDays != null && model.elapsedDays != null ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="savings-cycle-facts"
        >
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <div
              className="flex flex-col gap-(--space-3) p-(--space-4)"
              data-testid="savings-term-progress"
            >
              <div className="flex items-center justify-between gap-(--space-2)">
                <div className="flex items-center gap-(--space-2)">
                  <IconContainer tone={IconContainerTone.SAVINGS} size="sm">
                    <AppIcon
                      icon={UTILITY_ICONS.calendar}
                      size={AppIconSize.SM}
                    />
                  </IconContainer>
                  <SavingsSectionTitle>
                    {t("progressLabel")}
                  </SavingsSectionTitle>
                </div>
                <Text
                  size="xs"
                  tone="secondary"
                  className="shrink-0 rounded-(--radius-control) bg-surface-muted px-(--space-2) py-(--space-1)"
                >
                  {t("cycleProgress", {
                    percent: formatPercent(model.progressRatio ?? 0, locale, {
                      maximumFractionDigits: 0,
                    }),
                  })}
                </Text>
              </div>
              <Text size="xs" tone="secondary">
                {t("termLine", { term: termLabel })}
              </Text>
              <div className="grid grid-cols-2 gap-(--space-3)">
                <div className="min-w-0 rounded-(--radius-control) border border-border-subtle bg-surface-muted p-(--space-3)">
                  <Text size="xs" tone="secondary">
                    {t("startDateLabel")}
                  </Text>
                  <Text size="sm" weight="semibold" tabular>
                    {formatIsoDate(cycle.startDate, locale)}
                  </Text>
                </div>
                <div className="min-w-0 rounded-(--radius-control) border border-warning/30 bg-warning/10 p-(--space-3)">
                  <Text size="xs" className="text-warning">
                    {t("maturityDateLabel")}
                  </Text>
                  <Text size="sm" weight="semibold" tabular>
                    {formatIsoDate(cycle.endDate, locale)}
                  </Text>
                  {model.daysUntilMaturity != null &&
                  model.daysUntilMaturity >= 0 ? (
                    <Text size="xs" className="mt-(--space-1) text-warning">
                      {t("daysRemaining", { days: model.daysUntilMaturity })}
                    </Text>
                  ) : null}
                </div>
              </div>
              <Progress
                value={Math.min(model.elapsedDays, model.totalTermDays)}
                max={Math.max(1, model.totalTermDays)}
                label={t("progressLabel")}
                showLabel={false}
                tone={IconContainerTone.SAVINGS}
              />
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-(--space-2)">
                <Text size="xs" tone="secondary" className="min-w-0">
                  {t("timelineDay", { day: 0 })}
                </Text>
                <Text size="xs" weight="medium" className="text-center">
                  {t("progressDays", {
                    elapsed: Math.min(model.elapsedDays, model.totalTermDays),
                    total: model.totalTermDays,
                  })}
                </Text>
                <Text size="xs" tone="secondary" className="min-w-0 text-right">
                  {t("timelineDay", { day: model.totalTermDays })}
                </Text>
              </div>
            </div>
            <dl
              className="divide-y divide-divider border-t border-divider"
              data-testid="savings-expected-return"
            >
              <SavingsFactRow
                label={t("expectedTaxLabel")}
                value={<FinancialValue>{money(model.tax)}</FinancialValue>}
                className="py-(--space-2)"
              />
              <SavingsFactRow
                label={t("expectedNetInterestLabel")}
                value={
                  <FinancialValue className="text-success">
                    {money(model.netInterest)}
                  </FinancialValue>
                }
                className="py-(--space-2)"
              />
              <SavingsFactRow
                label={t("expectedReceivedLabel")}
                value={
                  <FinancialValue>
                    {money(model.totalCashReceived)}
                  </FinancialValue>
                }
                emphasis
                className="py-(--space-2)"
              />
            </dl>
            <Text
              size="xs"
              tone="muted"
              className="border-t border-divider px-(--space-4) py-(--space-3) text-pretty"
            >
              {t("expectedValueHint")}
            </Text>
          </Card>
        </section>
      ) : null}

      {canAct ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="savings-maturity-instruction"
        >
          <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
            <div className="flex flex-wrap items-center justify-between gap-(--space-2)">
              <SavingsSectionTitle>
                {t("maturityInstructionTitle")}
              </SavingsSectionTitle>
              <Text
                size="xs"
                className="rounded-full bg-primary-soft px-(--space-2) py-(--space-1) text-primary"
              >
                {t(`renewalPolicies.${item.renewalPolicy}`)}
              </Text>
            </div>
            <div className="rounded-(--radius-control) border border-border-subtle bg-surface-muted p-(--space-3)">
              <div className="flex items-start gap-(--space-2)">
                <AppIcon
                  icon={ACTION_ICONS.success}
                  size={AppIconSize.MD}
                  className="shrink-0 text-primary"
                />
                <Text size="sm" weight="semibold">
                  {t(`settlementRules.${item.maturityInstruction.strategy}`)}
                </Text>
              </div>
              <Text
                size="xs"
                tone="secondary"
                className="mt-(--space-2) text-pretty"
              >
                {t(
                  item.renewalPolicy ===
                    RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED
                    ? "renewalPolicyAutoHint"
                    : "renewalPolicyManualHint",
                )}
              </Text>
              <dl className="divide-y divide-divider">
                {item.maturityInstruction.strategy !==
                SettlementRule.WITHDRAW_EVERYTHING ? (
                  <SavingsFactRow
                    label={t("targetPackageLabel")}
                    value={targetPackageDisplay}
                    className="px-0"
                  />
                ) : null}
                <SavingsFactRow
                  label={t("settlementAccountLabel")}
                  value={settlementAccountName}
                  className="px-0"
                />
              </dl>
            </div>
            <div>
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

      <div
        className="grid grid-cols-3 gap-(--space-2)"
        data-testid="savings-detail-actions"
      >
        {model.canSettleEarly ? (
          <Link
            href={moneySavingsEarlyWithdrawPath(item.id)}
            data-testid="savings-early-withdraw"
            className="flex min-h-20 min-w-0 flex-col items-center justify-center gap-(--space-1) rounded-(--radius-control) border border-warning/30 bg-warning/10 p-(--space-2) text-center text-warning focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <AppIcon icon={FINANCE_ICONS.expense} size={AppIconSize.MD} />
            <Text size="xs" weight="semibold">
              {t("earlyWithdraw")}
            </Text>
          </Link>
        ) : null}
        {canAct ? (
          <RenewalPolicyEditor
            savingId={item.id}
            renewalPolicy={item.renewalPolicy}
            renewalConfig={item.renewalConfig}
            packages={packages}
            accounts={accounts}
            compact
          />
        ) : null}
        {cycles && cycles.length > 0 ? (
          <a
            href="#savings-cycle-history"
            className="flex min-h-20 min-w-0 flex-col items-center justify-center gap-(--space-1) rounded-(--radius-control) border border-border-subtle bg-surface p-(--space-2) text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <AppIcon
              icon={UTILITY_ICONS.calendar}
              size={AppIconSize.MD}
              className="text-text-secondary"
            />
            <Text size="xs" weight="semibold">
              {t("historyTitle")}
            </Text>
            <Text size="xs" tone="secondary">
              {t("cycleLabel", { number: cycles.length })}
            </Text>
          </a>
        ) : null}
      </div>
      {model.canSettleEarly ? (
        <StatusAlert variant="warning" title={t("earlyWithdrawalNotice")} />
      ) : null}

      {cycles && cycles.length > 0 ? (
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="savings-cycle-history"
          id="savings-cycle-history"
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

      <details className="rounded-(--radius-control) border border-border-subtle bg-surface p-(--space-4)">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus-ring">
          {t("productDetailsTitle")}
        </summary>
        <div className="flex flex-col gap-(--space-3)">
          <dl
            data-testid="savings-product-details"
            className="divide-y divide-divider"
          >
            <SavingsFactRow
              label={t("providerLabel")}
              value={item.providerName || t("title")}
            />
            <SavingsFactRow label={t("familyLabel")} value={familyLabel} />
            <SavingsFactRow label={t("termLabel")} value={termLabel} />
            <SavingsFactRow label={t("currencyLabel")} value={currency} />
          </dl>
          <Text size="xs" tone="muted">
            {tProducts("notBankBalance")}
          </Text>
          <dl
            data-testid="savings-money-flow"
            className="divide-y divide-divider"
          >
            <SavingsFactRow
              label={t("fundingAccountLabel")}
              value={
                historicalOpening
                  ? t("historicalOpeningFlowLine")
                  : fundingAccountName
              }
            />
            <SavingsFactRow
              label={t("settlementAccountLabel")}
              value={settlementAccountName}
            />
          </dl>
        </div>
      </details>

      {isTerminal ? (
        <StatusAlert variant="info" title={t("terminalReadOnly")} />
      ) : null}

      {(model.canSettle && cycle) ||
      (!model.canSettle && !model.canSettleEarly && !isTerminal) ? (
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
          {!model.canSettle && !model.canSettleEarly && !isTerminal ? (
            <Text size="sm" tone="secondary">
              {t("noSettlementYet")}
            </Text>
          ) : null}
        </BottomActionBar>
      ) : null}
    </Page>
  );
}
