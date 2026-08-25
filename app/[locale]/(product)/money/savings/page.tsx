import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneySavingsPath,
  moneySavingsNewPath,
  moneySavingsProvidersPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listSavings,
  buildSavingsOverviewModel,
  SavingsFamily,
  type SavingsPresentationItem,
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
import { ErrorState } from "@/shared/patterns/error-state";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { StatusBadge } from "@/shared/ui/status-badge";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FinancialOwnershipBadge } from "@/shared/patterns/financial-ownership-badge";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { BankIcon, SmartPhoneIcon } from "@hugeicons/core-free-icons";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { SavingsCreateAction } from "./savings-create-action";
import { SavingsMaturityBadge } from "./savings-maturity-badge";

type Props = { params: Promise<{ locale: string }> };

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
}

function familyIcon(family: SavingsFamily) {
  return family === SavingsFamily.BANK ? BankIcon : SmartPhoneIcon;
}

function SummaryMetric({
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
        as="div"
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

export default async function SavingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id)))
    return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, tProducts, tCatalog, items] = await Promise.all([
    getTranslations("money.savingsPage"),
    getTranslations("money.products"),
    getTranslations("money.savingsCatalog"),
    listSavings(),
  ]);
  const loadFailed = items == null;
  const model = buildSavingsOverviewModel(items ?? []);

  const renderGroup = (
    title: string,
    hint: string,
    groupItems: SavingsPresentationItem[],
    testId: string,
  ) => (
    <Section title={title} description={hint} testId={testId}>
      {groupItems.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("activeEmpty")}
        </Text>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {groupItems.map((entry) => {
            const item = entry.saving;
            const cycle = item.latestCycle;
            const state = entry.maturityState;
            const family = item.savingsFamily;
            const currency = item.productSnapshot.currency ?? DEFAULT_CURRENCY;
            const rate = cycle?.lockedRate ?? 0;
            return (
              <li key={item.id}>
                <Link
                  href={moneySavingsPath(item.id)}
                  className="block rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  data-testid={`savings-row-${item.id}`}
                >
                  <Card
                    tone="interactive"
                    className="gap-(--space-3) p-(--space-3)"
                  >
                    <div className="flex items-start gap-(--space-3)">
                      <IconContainer tone="savings" size="sm">
                        <AppIcon
                          icon={familyIcon(family)}
                          size="sm"
                          label={
                            family === SavingsFamily.BANK
                              ? t("bankGroup")
                              : t("platformGroup")
                          }
                        />
                      </IconContainer>
                      <div className="min-w-0 flex-1">
                        <Text
                          size="sm"
                          weight="semibold"
                          className="truncate text-text-primary"
                        >
                          {item.providerName || t("fallbackName")}
                        </Text>
                        <Text
                          size="xs"
                          tone="secondary"
                          className="truncate text-pretty"
                        >
                          {item.productName ||
                            item.productSnapshot.packageName ||
                            t("fallbackName")}
                        </Text>
                        {item.ownership.financialScope ===
                        FINANCIAL_SCOPE.PERSONAL ? (
                          <FinancialOwnershipBadge
                            financialScope={item.ownership.financialScope}
                            isOwnedByMe={item.ownership.isOwnedByMe}
                            ownerStatus={item.ownership.ownerStatus}
                            compact
                          />
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <Text size="lg" weight="semibold" tabular>
                          <FinancialValue>
                            {formatCurrency(entry.principal, currency, locale, {
                              maximumFractionDigits: 0,
                            })}
                          </FinancialValue>
                        </Text>
                        <Text size="xs" tone="muted">
                          {t("rateLabel", {
                            rate: formatPercent(rate / 100, locale, {
                              maximumFractionDigits: 2,
                            }),
                          })}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-(--space-3) border-t border-divider pt-(--space-2)">
                      <SavingsMaturityBadge
                        state={state}
                        label={t(`maturityState.${state}`)}
                      />
                      <div className="flex min-w-0 flex-col items-end gap-(--space-1) text-right">
                        <Text size="xs" tone="secondary">
                          {cycle
                            ? t("maturityDateOnly", {
                                date: formatIsoDate(cycle.endDate, locale),
                              })
                            : "—"}
                        </Text>
                        <Text size="xs" tone="muted">
                          {entry.daysUntilMaturity != null &&
                          entry.daysUntilMaturity >= 0
                            ? t("daysRemaining", {
                                days: entry.daysUntilMaturity,
                              })
                            : t(`maturityState.${state}`)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );

  return (
    <Page
      testId="money-savings"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <MoneyOfflineBanner />
      {loadFailed ? (
        <ErrorState
          title={t("loadErrorTitle")}
          description={t("loadErrorDescription")}
          className="flex-none py-(--space-4)"
        />
      ) : model.items.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          className="flex-none py-(--space-4)"
          action={
            <div className="flex flex-wrap items-center justify-center gap-(--space-2)">
              <Link
                href={moneySavingsNewPath()}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid="savings-add-open"
              >
                {t("add")}
              </Link>
              <Link
                href={moneySavingsProvidersPath()}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                data-testid="savings-manage-providers"
              >
                {tCatalog("manageLink")}
              </Link>
            </div>
          }
        />
      ) : (
        <div
          className="flex flex-col gap-(--space-5)"
          data-testid="savings-list-content"
        >
          <MotionReveal>
            <section
              className="flex flex-col gap-(--space-3)"
              data-testid="savings-summary"
            >
              <Card tone="hero" className="gap-0 p-(--space-4)">
                <Text size="sm" weight="medium" className="text-hero-muted">
                  {t("principalTotal")}
                </Text>
                <p className="mt-(--space-2) font-semibold tabular-nums tracking-tight text-3xl text-hero-fg">
                  <FinancialValue>
                    {formatCurrency(
                      model.totalPrincipal,
                      DEFAULT_CURRENCY,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </FinancialValue>
                </p>
                <Text
                  size="xs"
                  className="mt-(--space-2) text-pretty text-hero-muted"
                >
                  {tProducts("notBankBalance")}
                </Text>
                {model.attentionCount > 0 ? (
                  <Text
                    size="xs"
                    className="mt-(--space-1) text-pretty text-hero-muted"
                  >
                    {t("orientation", {
                      active: model.activeItems.length,
                      due: model.attentionCount,
                    })}
                  </Text>
                ) : null}
              </Card>
              <Card
                tone="elevated"
                className="grid grid-cols-2 gap-(--space-3) p-(--space-4)"
                data-testid="savings-summary-metrics"
              >
                <SummaryMetric label={t("expectedNetInterest")}>
                  <FinancialValue>
                    {formatCurrency(
                      model.expectedNetInterest,
                      DEFAULT_CURRENCY,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </FinancialValue>
                </SummaryMetric>
                <SummaryMetric label={t("expectedReceived")}>
                  <FinancialValue>
                    {formatCurrency(
                      model.expectedTotalCashReceived,
                      DEFAULT_CURRENCY,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </FinancialValue>
                </SummaryMetric>
                {model.expectedTax > 0 ? (
                  <SummaryMetric label={t("expectedTax")}>
                    <FinancialValue>
                      {formatCurrency(
                        model.expectedTax,
                        DEFAULT_CURRENCY,
                        locale,
                        { maximumFractionDigits: 0 },
                      )}
                    </FinancialValue>
                  </SummaryMetric>
                ) : null}
                <SummaryMetric label={t("maturitySoon")}>
                  {model.attentionCount > 0 ? (
                    <StatusBadge tone="warning">
                      {t("maturitySummary", { count: model.attentionCount })}
                    </StatusBadge>
                  ) : (
                    t("maturitySummary", { count: model.attentionCount })
                  )}
                </SummaryMetric>
              </Card>
              <div className="flex justify-end">
                <Link
                  href={moneySavingsProvidersPath()}
                  className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
                  data-testid="savings-manage-providers"
                >
                  {tCatalog("manageLink")}
                </Link>
              </div>
            </section>
          </MotionReveal>
          {renderGroup(
            t("bankGroup"),
            t("familyBankHint"),
            model.bankItems,
            "savings-bank-group",
          )}
          {renderGroup(
            t("platformGroup"),
            t("familyPlatformHint"),
            model.platformItems,
            "savings-platform-group",
          )}
          {model.historyItems.length > 0 ? (
            <Section
              title={t("historySection")}
              description={t("historyCaption")}
              testId="savings-history-section"
            >
              <ul className="flex flex-col gap-(--space-2)">
                {model.historyItems.map((entry) => (
                  <li key={entry.saving.id}>
                    <Link
                      href={moneySavingsPath(entry.saving.id)}
                      className="block rounded-(--radius-card) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      data-testid={`savings-history-row-${entry.saving.id}`}
                    >
                      <Card
                        tone="soft"
                        className="gap-(--space-2) p-(--space-3)"
                      >
                        <div className="flex items-start justify-between gap-(--space-3)">
                          <div className="min-w-0">
                            <Text
                              size="sm"
                              weight="medium"
                              className="truncate"
                            >
                              {entry.saving.productName ||
                                entry.saving.providerName ||
                                t("fallbackName")}
                            </Text>
                            <Text
                              size="xs"
                              tone="secondary"
                              className="truncate text-pretty"
                            >
                              {entry.saving.providerName || t("fallbackName")}
                            </Text>
                          </div>
                          <SavingsMaturityBadge
                            state={entry.maturityState}
                            label={t(`maturityState.${entry.maturityState}`)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-(--space-3)">
                          <Text size="xs" tone="muted" className="text-pretty">
                            {tProducts("notBankBalance")}
                          </Text>
                          <Text
                            size="sm"
                            weight="medium"
                            tabular
                            className="text-text-primary"
                          >
                            <FinancialValue>
                              {formatCurrency(
                                entry.principal,
                                entry.saving.productSnapshot.currency ??
                                  DEFAULT_CURRENCY,
                                locale,
                                { maximumFractionDigits: 0 },
                              )}
                            </FinancialValue>
                          </Text>
                        </div>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          <div aria-hidden="true" className="h-(--space-16) shrink-0" />
          <SavingsCreateAction />
        </div>
      )}
    </Page>
  );
}
