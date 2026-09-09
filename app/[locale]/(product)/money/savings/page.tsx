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
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { SavingsCreateAction } from "./savings-create-action";
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
    <div className="flex min-w-0 items-start justify-between gap-(--space-3)">
      <Text size="sm" tone="secondary" className="text-pretty">
        {label}
      </Text>
      <div className="min-w-0 text-right">{children}</div>
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
    <section className="flex flex-col gap-(--space-2)" data-testid={testId}>
      <div className="flex items-end justify-between gap-(--space-3)">
        <div className="min-w-0">
          <SavingsSectionTitle>{title}</SavingsSectionTitle>
          <Text
            size="xs"
            tone="secondary"
            className="mt-(--space-1) text-pretty"
          >
            {hint}
          </Text>
        </div>
        <Text size="xs" tone="muted" className="shrink-0 tabular-nums">
          {t("familyCount", { count: groupItems.length })}
        </Text>
      </div>
      {groupItems.length === 0 ? (
        <Card tone="elevated" className="gap-0 overflow-hidden p-0">
          <SavingsGroupEmpty>{t("activeEmpty")}</SavingsGroupEmpty>
        </Card>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {groupItems.map((entry) => {
            const item = entry.saving;
            const cycle = item.latestCycle;
            const currency = item.productSnapshot.currency ?? DEFAULT_CURRENCY;
            const rate = cycle?.lockedRate ?? 0;
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
              ? entry.daysUntilMaturity != null && entry.daysUntilMaturity >= 0
                ? t("daysRemaining", { days: entry.daysUntilMaturity })
                : t("maturityDateOnly", {
                    date: formatIsoDate(cycle.endDate, locale),
                  })
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
                  title={item.providerName || t("fallbackName")}
                  subtitle={`${productName} · ${rateLabel}`}
                  principalLabel={moneyLabel(entry.principal, currency, locale)}
                  principalCaption={t("amountLabel")}
                  maturityState={entry.maturityState}
                  maturityLabel={t(`maturityState.${entry.maturityState}`)}
                  maturityMeta={maturityMeta}
                  ownership={item.ownership}
                />
              </li>
            );
          })}
        </ul>
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
                tone="hero"
                className="gap-0 p-(--space-4)"
                data-financial-object="savings"
              >
                <div className="flex items-center justify-between gap-(--space-3)">
                  <Text size="sm" weight="medium" className="text-hero-muted">
                    {t("principalTotal")}
                  </Text>
                  <SavingsPrivacyToggle />
                </div>
                <Amount
                  amountLabel={moneyLabel(
                    model.totalPrincipal,
                    DEFAULT_CURRENCY,
                    locale,
                  )}
                  size={AmountSize.HERO}
                  className="mt-(--space-2)"
                  amountClassName="text-hero-fg"
                />
                <Text
                  size="xs"
                  className="mt-(--space-2) text-pretty text-hero-muted"
                >
                  {tProducts("notBankBalance")}
                </Text>
                <div className="mt-(--space-4) border-t border-white/15 pt-(--space-3)">
                  {model.attentionCount > 0 ? (
                    <Text size="xs" className="text-pretty text-hero-muted">
                      {t("orientation", {
                        active: model.activeItems.length,
                        due: model.attentionCount,
                      })}
                    </Text>
                  ) : (
                    <Text size="xs" className="text-pretty text-hero-muted">
                      {t("summaryCaption")}
                    </Text>
                  )}
                </div>
              </Card>
              <Card
                tone="elevated"
                className="gap-0 p-(--space-4)"
                data-testid="savings-summary-metrics"
              >
                <SavingsSectionTitle>{t("summaryTitle")}</SavingsSectionTitle>
                <div className="mt-(--space-3) flex flex-col gap-(--space-3)">
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
                    {model.attentionCount > 0 ? (
                      <StatusBadge tone={StatusBadgeTone.WARNING}>
                        {t("maturitySummary", { count: model.attentionCount })}
                      </StatusBadge>
                    ) : (
                      <Text size="sm" weight="medium">
                        {t("maturitySummary", { count: model.attentionCount })}
                      </Text>
                    )}
                  </SummaryMetric>
                </div>
              </Card>
              <div className="flex justify-end">
                <Link
                  href={moneySavingsProvidersPath()}
                  className="inline-flex min-h-11 items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
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
          <div aria-hidden="true" className="h-(--space-16) shrink-0" />
          <SavingsCreateAction />
        </div>
      )}
    </Page>
  );
}
