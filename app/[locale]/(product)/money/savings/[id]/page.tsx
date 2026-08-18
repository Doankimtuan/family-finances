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
import { listAccounts } from "@/modules/ledger/application";
import {
  getSaving,
  listSavingCycles,
  listProviderPackages,
  listSavingsFinancialActivities,
  buildSavingsDetailModel,
  SavingsEventKind,
  SavingStatus,
  SettlementRule,
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
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import {
  TransactionAmountTone,
  TransactionRow,
} from "@/shared/patterns/transaction-row";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { RenewalPolicyEditor } from "./renewal-policy-editor";
import { SavingsSettlementFlow } from "./settlement-flow";
import { SavingsCycleHistory } from "./savings-cycle-history";

type Props = { params: Promise<{ locale: string; id: string }> };

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
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
        topBar={<TopAppBar title={t("title")} />}
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
    canAct ? listAccounts() : Promise.resolve(null),
  ]);
  const cycleSnapshot = cycle?.packageSnapshot;
  const legacyImport = Boolean(
    (item.productSnapshot as { legacyImport?: boolean }).legacyImport,
  );
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

  return (
    <Page
      testId="savings-detail"
      topBar={
        <TopAppBar
          title={item.productName || t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <MoneyOfflineBanner />
      <Text size="sm" tone="secondary">
        {tProducts("notBankBalance")}
      </Text>
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
          className="rounded-[var(--radius-card)] bg-surface-muted/65 p-(--space-5) shadow-[var(--elevation-1)]"
          data-testid="savings-identity"
        >
          <div className="flex items-start justify-between gap-(--space-3)">
            <div className="min-w-0">
              <Text size="xs" tone="secondary">
                {familyLabel}
              </Text>
              <Text
                size="lg"
                weight="semibold"
                className="mt-(--space-1) truncate"
              >
                {item.providerName || t("title")}
              </Text>
              <Text
                size="sm"
                tone="secondary"
                className="mt-(--space-1) truncate"
              >
                {cycleSnapshot?.packageName ||
                  item.productSnapshot.packageName ||
                  item.productName ||
                  t("title")}
              </Text>
            </div>
            <span className="shrink-0 rounded-full bg-accent/10 px-(--space-2) py-1 text-xs font-medium text-accent">
              {stateLabel}
            </span>
          </div>
          <FinancialOwnershipBadge
            financialScope={item.ownership.financialScope}
            isOwnedByMe={item.ownership.isOwnedByMe}
          />
          <Amount
            className="mt-(--space-5)"
            label={t("principalHeroLabel")}
            amountLabel={money(model.principal)}
            size="lg"
          />
          {cycle ? (
            <Text size="sm" tone="secondary" className="mt-(--space-2)">
              {t("maturityDate", {
                date: formatIsoDate(cycle.endDate, locale),
              })}
              {model.daysUntilMaturity != null && model.daysUntilMaturity >= 0
                ? ` · ${t("daysRemaining", { days: model.daysUntilMaturity })}`
                : ""}
            </Text>
          ) : null}
        </section>
      </MotionReveal>

      {cycle ? (
        <Section title={t("cycleFactsTitle")} testId="savings-cycle-facts">
          <div className="grid grid-cols-2 gap-(--space-3)">
            <div>
              <Text size="xs" tone="secondary">
                {t("rateLine", {
                  rate: formatPercent(cycle.lockedRate / 100, locale, {
                    maximumFractionDigits: 2,
                  }),
                })}
              </Text>
              <Text size="sm" weight="semibold">
                {t("termLine", { term: termLabel })}
              </Text>
            </div>
            <div className="text-right">
              <Text size="xs" tone="secondary">
                {t("maturityStateLabel")}
              </Text>
              <Text size="sm" weight="semibold">
                {stateLabel}
              </Text>
            </div>
          </div>
          <div className="mt-(--space-4) grid gap-(--space-2) border-t border-border-subtle/70 pt-(--space-3)">
            <Amount
              label={t("expectedGrossInterestLabel")}
              amountLabel={money(model.grossInterest)}
            />
            <Amount
              label={t("expectedTaxLabel")}
              amountLabel={money(model.tax)}
            />
            <Amount
              label={t("expectedNetInterestLabel")}
              amountLabel={money(model.netInterest)}
            />
            <Amount
              label={t("expectedReceivedLabel")}
              amountLabel={money(model.totalCashReceived)}
            />
          </div>
          <Text size="sm" tone="secondary" className="mt-(--space-2)">
            {t("expectedValueHint")}
          </Text>
          {model.totalTermDays && model.elapsedDays != null ? (
            <div
              className="mt-(--space-4) border-t border-border-subtle/70 pt-(--space-3)"
              data-testid="savings-term-progress"
            >
              <div className="flex items-center justify-between gap-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("progressLabel")}
                </Text>
                <Text size="sm" weight="semibold">
                  {t("progressDays", {
                    elapsed: Math.min(model.elapsedDays, model.totalTermDays),
                    total: model.totalTermDays,
                  })}
                </Text>
              </div>
              <progress
                className="mt-(--space-2) h-2 w-full accent-accent"
                max={1}
                value={model.progressRatio ?? 0}
                aria-label={t("progressLabel")}
              />
            </div>
          ) : null}
        </Section>
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
            <dt className="text-sm text-text-secondary">
              {t("familyLine", { family: "" }).replace(": ", "")}
            </dt>
            <dd className="text-sm font-medium">{familyLabel}</dd>
          </div>
          <div className="flex justify-between gap-(--space-3) py-(--space-2)">
            <dt className="text-sm text-text-secondary">
              {t("termLine", { term: "" }).replace(": ", "")}
            </dt>
            <dd className="text-sm font-medium">{termLabel}</dd>
          </div>
          <div className="flex justify-between gap-(--space-3) py-(--space-2)">
            <dt className="text-sm text-text-secondary">
              {t("currencyLine", { currency: "" }).replace(": ", "")}
            </dt>
            <dd className="text-sm font-medium">{currency}</dd>
          </div>
        </dl>
      </Section>

      <Section title={t("moneyFlowTitle")} testId="savings-money-flow">
        <Text size="sm" tone="secondary">
          {t("fundingAccountLine", {
            account: item.fundingAccountName || t("accountFallback"),
          })}
        </Text>
        <Text size="sm" tone="secondary">
          {t("settlementAccountLine", {
            account: item.settlementAccountName || t("accountFallback"),
          })}
        </Text>
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

      <Section title={t("activityTitle")} testId="savings-financial-activity">
        {activities && activities.length > 0 ? (
          <div className="grid gap-(--space-2)">
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
                />
              );
            })}
          </div>
        ) : (
          <Text size="sm" tone="secondary">
            {t("activityEmpty")}
          </Text>
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
              principal={model.principal}
              grossInterest={model.grossInterest}
              tax={model.tax}
              fee={model.fee}
              totalCashReceived={model.totalCashReceived}
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
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
        <Link
          href={APP_PATH.MONEY_SAVINGS}
          className="inline-flex min-h-11 w-full items-center justify-center text-sm font-medium text-accent"
          data-testid="savings-detail-back"
        >
          {t("back")}
        </Link>
      </BottomActionBar>
    </Page>
  );
}
