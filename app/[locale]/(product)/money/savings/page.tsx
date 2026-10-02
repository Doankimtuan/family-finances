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
import { getSessionMembership } from "@/modules/tenancy/application/get-session-membership";
import {
  listSavings,
  buildSavingsOverviewModel,
  SavingsFamily,
  SavingsMaturityState,
  type SavingsPresentationItem,
} from "@/modules/savings/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/shared/i18n/formatters";
import {
  HeaderPill,
  HeaderPillTone,
  TopAppBar,
} from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  UTILITY_ICONS,
} from "@/shared/ui/icon-registry";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { SavingsPrivacyToggle } from "./savings-privacy-toggle";
import { SavingsGroupEmpty, SavingsProductRow } from "./savings-product-row";
import { SavingsSectionTitle } from "./savings-section-title";

type Props = { params: Promise<{ locale: string }> };

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
}

function moneyLabel(value: number, currency: string, locale: string) {
  return formatCurrency(value, currency, locale, { maximumFractionDigits: 0 });
}

function SummaryMetric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-(--space-1)">
      <Text size="xs" tone="secondary" className="text-pretty">
        {label}
      </Text>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default async function SavingsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  const { user, membership } = await getSessionMembership();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, tProducts, tCatalog, tWizard, items] = await Promise.all([
    getTranslations("money.savingsPage"),
    getTranslations("money.products"),
    getTranslations("money.savingsCatalog"),
    getTranslations("money.savingsWizard"),
    listSavings(),
  ]);
  const loadFailed = items == null;
  const model = buildSavingsOverviewModel(items ?? []);
  const upcomingMaturities = model.activeItems.filter(
    ({ maturityState }) => maturityState === SavingsMaturityState.MATURING_SOON,
  );
  const pendingReview =
    model.activeItems.find(({ actionRequired }) => actionRequired) ??
    upcomingMaturities[0];

  const renderGroup = (
    title: string,
    hint: string,
    groupItems: SavingsPresentationItem[],
    testId: string,
  ) => (
    <section className="flex flex-col gap-(--space-2)" data-testid={testId}>
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="min-w-0">
          <div className="flex items-center gap-(--space-2)">
            <SavingsSectionTitle>{title}</SavingsSectionTitle>
            <Text
              size="xs"
              tone="secondary"
              className="shrink-0 rounded-full bg-surface-muted px-(--space-2) py-(--space-1) tabular-nums"
            >
              {groupItems.length}
            </Text>
          </div>
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-1) text-pretty"
          >
            {hint}
          </Text>
        </div>
        <Text
          size="xs"
          weight="medium"
          tone="secondary"
          className="shrink-0 text-right tabular-nums"
        >
          <FinancialValue>
            {moneyLabel(
              groupItems.reduce((sum, entry) => sum + entry.principal, 0),
              DEFAULT_CURRENCY,
              locale,
            )}
          </FinancialValue>
        </Text>
      </div>
      {groupItems.length === 0 ? (
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <SavingsGroupEmpty>{t("activeEmpty")}</SavingsGroupEmpty>
        </Card>
      ) : (
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <ul className="flex flex-col divide-y divide-divider">
            {groupItems.map((entry) => {
              const item = entry.saving;
              const cycle = item.latestCycle;
              const currency =
                item.productSnapshot.currency ?? DEFAULT_CURRENCY;
              const rate =
                cycle?.lockedRate ?? item.productSnapshot.annualInterestRate;
              const productName =
                item.productName ||
                item.productSnapshot.packageName ||
                t("fallbackName");
              const rateLabel = t("rateLabel", {
                rate: formatPercent(rate / 100, locale, {
                  maximumFractionDigits: 2,
                }),
              });
              const maturityMeta = cycle
                ? [
                    t("maturityDateOnly", {
                      date: formatIsoDate(cycle.endDate, locale),
                    }),
                    ...(entry.daysUntilMaturity != null &&
                    entry.daysUntilMaturity >= 0
                      ? [
                          t("daysRemaining", {
                            days: entry.daysUntilMaturity,
                          }),
                        ]
                      : []),
                  ].join(" · ")
                : undefined;
              return (
                <li key={item.id}>
                  <SavingsProductRow
                    href={moneySavingsPath(item.id)}
                    testId={`savings-row-${item.id}`}
                    family={item.savingsFamily}
                    familyLabel={
                      item.savingsFamily === SavingsFamily.BANK
                        ? t("bankGroup")
                        : t("platformGroup")
                    }
                    title={productName}
                    subtitle={`${item.providerName || t("fallbackName")} · ${rateLabel}`}
                    principalLabel={moneyLabel(
                      entry.principal,
                      currency,
                      locale,
                    )}
                    principalCaption={t("amountLabel")}
                    maturityState={entry.maturityState}
                    maturityLabel={t(`maturityState.${entry.maturityState}`)}
                    maturityMeta={maturityMeta}
                    expectedInterestLabel={
                      entry.netInterest > 0
                        ? moneyLabel(entry.netInterest, currency, locale)
                        : undefined
                    }
                    expectedInterestCaption={t("expectedInterestLabel")}
                    ownership={item.ownership}
                    grouped
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </section>
  );

  return (
    <Page
      testId="money-savings"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          title={
            <div className="flex min-w-0 items-center gap-(--space-2)">
              <Heading level={1} className="truncate text-base leading-snug">
                {t("title")}
              </Heading>
              {model.activeItems.length > 0 ? (
                <HeaderPill tone={HeaderPillTone.POSITIVE} className="shrink-0">
                  {t("activeBookCount", {
                    count: model.activeItems.length,
                  })}
                </HeaderPill>
              ) : null}
            </div>
          }
          subtitle={t("subtitle")}
          trailing={
            model.items.length > 0 ? (
              <div className="flex items-center gap-(--space-2)">
                <Link
                  href={moneySavingsProvidersPath()}
                  aria-label={tCatalog("manageLink")}
                  className="inline-flex size-10 items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  data-testid="savings-manage-providers"
                >
                  <AppIcon icon={FINANCE_ICONS.bank} size={AppIconSize.SM} />
                </Link>
                <Link
                  href={moneySavingsNewPath()}
                  className="inline-flex min-h-10 items-center justify-center gap-(--space-1) rounded-(--radius-control) bg-accent px-(--space-3) text-sm font-semibold text-accent-fg transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
                  {t("addShort")}
                </Link>
              </div>
            ) : null
          }
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
          icon={
            <AppIcon icon={FINANCE_ICONS.savings} size={AppIconSize.DISPLAY} />
          }
          action={
            <div className="flex w-full flex-col gap-(--space-2)">
              <Link
                href={moneySavingsNewPath()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) bg-accent px-(--space-4) text-sm font-semibold text-accent-fg transition-[background-color,transform] duration-(--duration-fast) hover:-translate-y-px active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
                data-testid="savings-add-open"
              >
                {t("add")}
              </Link>
              <Link
                href={moneySavingsProvidersPath()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
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
              <Card
                tone="elevated"
                className="gap-0 p-(--space-4)"
                data-financial-object="savings"
              >
                <div className="flex items-center justify-between gap-(--space-3)">
                  <div className="flex items-center gap-(--space-2)">
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-savings"
                    />
                    <Text
                      size="xs"
                      weight="medium"
                      tone="secondary"
                      className="uppercase tracking-wide"
                    >
                      {t("principalTotal")}
                    </Text>
                  </div>
                  <SavingsPrivacyToggle />
                </div>
                <Amount
                  amountLabel={moneyLabel(
                    model.totalPrincipal,
                    DEFAULT_CURRENCY,
                    locale,
                  )}
                  size={AmountSize.LG}
                  className="mt-(--space-2)"
                  amountClassName="text-text-primary"
                />
                <div className="mt-(--space-3) flex items-start gap-(--space-2) rounded-(--radius-control) border border-warning/25 bg-warning/10 p-(--space-3)">
                  <IconContainer tone={IconContainerTone.WARNING} size="xs">
                    <AppIcon icon={UTILITY_ICONS.info} size={AppIconSize.XS} />
                  </IconContainer>
                  <Text size="xs" tone="secondary" className="text-pretty">
                    {tProducts("notBankBalance")}
                  </Text>
                </div>
              </Card>
              <Card
                tone="elevated"
                className="gap-0 p-(--space-4)"
                data-testid="savings-summary-metrics"
              >
                <SavingsSectionTitle>{t("summaryTitle")}</SavingsSectionTitle>
                <div className="mt-(--space-3) grid grid-cols-2 gap-x-(--space-3) gap-y-(--space-4)">
                  <SummaryMetric label={t("expectedNetInterest")}>
                    <Text size="sm" weight="semibold" tabular>
                      <FinancialValue>
                        {moneyLabel(
                          model.expectedNetInterest,
                          DEFAULT_CURRENCY,
                          locale,
                        )}
                      </FinancialValue>
                    </Text>
                  </SummaryMetric>
                  <SummaryMetric label={t("expectedReceived")}>
                    <Text size="sm" weight="semibold" tabular>
                      <FinancialValue>
                        {moneyLabel(
                          model.expectedTotalCashReceived,
                          DEFAULT_CURRENCY,
                          locale,
                        )}
                      </FinancialValue>
                    </Text>
                  </SummaryMetric>
                  {model.expectedTax > 0 ? (
                    <SummaryMetric label={t("expectedTax")}>
                      <Text size="sm" weight="semibold" tabular>
                        <FinancialValue>
                          {moneyLabel(
                            model.expectedTax,
                            DEFAULT_CURRENCY,
                            locale,
                          )}
                        </FinancialValue>
                      </Text>
                    </SummaryMetric>
                  ) : null}
                  <SummaryMetric label={t("maturitySoon")}>
                    {upcomingMaturities.length > 0 ? (
                      <StatusBadge tone={StatusBadgeTone.WARNING}>
                        {t("maturitySummary", {
                          count: upcomingMaturities.length,
                        })}
                      </StatusBadge>
                    ) : (
                      <Text size="sm" weight="medium">
                        {t("maturitySummary", {
                          count: upcomingMaturities.length,
                        })}
                      </Text>
                    )}
                  </SummaryMetric>
                </div>
              </Card>
            </section>
          </MotionReveal>
          {pendingReview ? (
            <Link
              href={moneySavingsPath(pendingReview.saving.id)}
              className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-warning/30 bg-warning/10 p-(--space-3) transition-colors hover:bg-warning/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid="savings-maturity-decision"
            >
              <div className="flex items-center gap-(--space-3)">
                <IconContainer tone={IconContainerTone.WARNING} size="md">
                  <AppIcon
                    icon={UTILITY_ICONS.calendar}
                    size={AppIconSize.MD}
                  />
                </IconContainer>
                <div className="min-w-0 flex-1">
                  <SavingsSectionTitle>
                    {t(`maturityState.${pendingReview.maturityState}`)}
                  </SavingsSectionTitle>
                  <Text
                    size="sm"
                    weight="medium"
                    className="mt-(--space-1) truncate"
                  >
                    {pendingReview.saving.productName ||
                      pendingReview.saving.productSnapshot.packageName ||
                      t("fallbackName")}
                  </Text>
                  <Text size="xs" tone="secondary" className="truncate">
                    {pendingReview.saving.providerName || t("fallbackName")}
                  </Text>
                </div>
                <div className="shrink-0 text-right">
                  <Text size="sm" weight="semibold" tabular>
                    <FinancialValue>
                      {moneyLabel(
                        pendingReview.principal,
                        pendingReview.saving.productSnapshot.currency ??
                          DEFAULT_CURRENCY,
                        locale,
                      )}
                    </FinancialValue>
                  </Text>
                  {pendingReview.saving.latestCycle ? (
                    <Text size="xs" tone="secondary" className="mt-(--space-1)">
                      {formatIsoDate(
                        pendingReview.saving.latestCycle.endDate,
                        locale,
                      )}
                    </Text>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-(--space-3) border-t border-warning/20 pt-(--space-3)">
                <Text size="xs" tone="secondary" className="min-w-0">
                  {tWizard("renewalPolicyLabel")}:{" "}
                  {tWizard(
                    `renewalPolicies.${pendingReview.saving.renewalPolicy}`,
                  )}
                </Text>
                <span className="inline-flex shrink-0 items-center gap-(--space-1) text-xs font-semibold text-warning">
                  {pendingReview.daysUntilMaturity !== null &&
                  pendingReview.daysUntilMaturity >= 0
                    ? t("daysRemaining", {
                        days: pendingReview.daysUntilMaturity,
                      })
                    : t("reviewMaturity")}
                  <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.XS} />
                </span>
              </div>
            </Link>
          ) : null}
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
            <section
              className="flex flex-col gap-(--space-2)"
              data-testid="savings-history-section"
            >
              <div>
                <SavingsSectionTitle>{t("historySection")}</SavingsSectionTitle>
                <Text
                  size="xs"
                  tone="secondary"
                  className="mt-(--space-1) text-pretty"
                >
                  {t("historyCaption")}
                </Text>
              </div>
              <ul className="flex flex-col gap-(--space-2)">
                {model.historyItems.map((entry) => {
                  const currency =
                    entry.saving.productSnapshot.currency ?? DEFAULT_CURRENCY;
                  const rate = entry.saving.latestCycle?.lockedRate ?? 0;
                  return (
                    <li key={entry.saving.id}>
                      <SavingsProductRow
                        href={moneySavingsPath(entry.saving.id)}
                        testId={`savings-history-row-${entry.saving.id}`}
                        family={entry.saving.savingsFamily}
                        familyLabel={
                          entry.saving.savingsFamily === SavingsFamily.BANK
                            ? t("bankGroup")
                            : t("platformGroup")
                        }
                        title={
                          entry.saving.productName ||
                          entry.saving.providerName ||
                          t("fallbackName")
                        }
                        subtitle={`${entry.saving.providerName || t("fallbackName")} · ${t(
                          "rateLabel",
                          {
                            rate: formatPercent(rate / 100, locale, {
                              maximumFractionDigits: 2,
                            }),
                          },
                        )}`}
                        principalLabel={moneyLabel(
                          entry.principal,
                          currency,
                          locale,
                        )}
                        principalCaption={t("amountLabel")}
                        maturityState={entry.maturityState}
                        maturityLabel={t(
                          `maturityState.${entry.maturityState}`,
                        )}
                        history
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Page>
  );
}
