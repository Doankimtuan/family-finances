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
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
  buildSavingsOverviewModel,
  MaturityPresentationState,
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
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { ErrorState } from "@/shared/patterns/error-state";
import { MotionReveal } from "@/shared/motion";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";
import { BankIcon, SmartPhoneIcon } from "@hugeicons/core-free-icons";
import { MoneyOfflineBanner } from "../money-offline-banner";

type Props = { params: Promise<{ locale: string }> };

function formatIsoDate(iso: string, locale: string) {
  return formatDate(new Date(`${iso}T12:00:00`), locale);
}

function familyIcon(family: "BANK" | "PLATFORM") {
  return family === "BANK" ? BankIcon : SmartPhoneIcon;
}

function isMaturityAttention(state: MaturityPresentationState) {
  return (
    state === MaturityPresentationState.MATURED ||
    state === MaturityPresentationState.MATURE_TODAY ||
    state === MaturityPresentationState.ACTION_REQUIRED
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

  await backfillLegacySavingsAccounts();
  await detectMaturedSavings();
  const [t, tMoney, tProducts, tCatalog, items] = await Promise.all([
    getTranslations("money.savingsPage"),
    getTranslations("money"),
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
    <Section title={title} testId={testId}>
      <Text size="sm" tone="secondary">
        {hint}
      </Text>
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
            const family = item.savingsFamily === "BANK" ? "BANK" : "PLATFORM";
            const currency = item.productSnapshot.currency ?? DEFAULT_CURRENCY;
            const rate = cycle?.lockedRate ?? 0;
            const attention = isMaturityAttention(state);
            return (
              <li key={item.id}>
                <MotionReveal>
                  <Link
                    href={moneySavingsPath(item.id)}
                    className="block rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-4) transition-[border-color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-standard) hover:border-accent/50 hover:shadow-[var(--elevation-1)] active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
                    data-testid={`savings-row-${item.id}`}
                  >
                    <div className="flex items-start gap-(--space-3)">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent-soft text-accent">
                        <AppIcon
                          icon={familyIcon(family)}
                          size="sm"
                          label={
                            family === "BANK"
                              ? t("bankGroup")
                              : t("platformGroup")
                          }
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-(--space-2)">
                          <div className="min-w-0">
                            <Text
                              size="sm"
                              weight="semibold"
                              className="truncate"
                            >
                              {item.providerName || t("fallbackName")}
                            </Text>
                            <Text
                              size="xs"
                              tone="secondary"
                              className="mt-(--space-1) truncate"
                            >
                              {item.productName ||
                                item.productSnapshot.packageName ||
                                t("fallbackName")}
                            </Text>
                          </div>
                          <span
                            className={
                              attention
                                ? "shrink-0 rounded-full border border-accent/40 bg-accent/10 px-(--space-2) py-1 text-xs font-medium text-accent"
                                : "shrink-0 rounded-full bg-surface-hover px-(--space-2) py-1 text-xs font-medium text-text-secondary"
                            }
                          >
                            {t(`maturityState.${state}`)}
                          </span>
                        </div>
                        <Amount
                          className="mt-(--space-3)"
                          label={tProducts("principalLabel")}
                          amountLabel={formatCurrency(
                            entry.principal,
                            currency,
                            locale,
                            { maximumFractionDigits: 0 },
                          )}
                          size="lg"
                        />
                        <div className="mt-(--space-2) grid grid-cols-2 gap-(--space-2) text-xs text-text-secondary">
                          <span>
                            {t("rateLabel", {
                              rate: formatPercent(rate / 100, locale, {
                                maximumFractionDigits: 2,
                              }),
                            })}
                          </span>
                          <span className="text-right">
                            {t("expectedInterestLabel")}:{" "}
                            {formatCurrency(
                              entry.netInterest,
                              currency,
                              locale,
                              { maximumFractionDigits: 0 },
                            )}
                          </span>
                        </div>
                        <div className="mt-(--space-1) flex flex-wrap justify-between gap-(--space-2) text-xs text-text-secondary">
                          <span>
                            {cycle
                              ? t("maturityDateOnly", {
                                  date: formatIsoDate(cycle.endDate, locale),
                                })
                              : "—"}
                          </span>
                          <span>
                            {entry.daysUntilMaturity != null &&
                            entry.daysUntilMaturity >= 0
                              ? t("daysRemaining", {
                                  days: entry.daysUntilMaturity,
                                })
                              : t(`maturityState.${state}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </MotionReveal>
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
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <MoneyOfflineBanner />
      <Text size="sm" tone="secondary">
        {t("orientation", {
          active: model.activeItems.length,
          due: model.attentionCount,
        })}
      </Text>
      <Text size="sm" tone="secondary">
        {tProducts("notBankBalance")}
      </Text>
      <div className="flex flex-wrap gap-(--space-2)">
        <Link
          href={moneySavingsNewPath()}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="savings-add-open"
        >
          {t("add")}
        </Link>
        <Link
          href={moneySavingsProvidersPath()}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="savings-manage-providers"
        >
          {tCatalog("manageLink")}
        </Link>
      </div>
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
        />
      ) : (
        <>
          <MotionReveal>
            <section
              className="rounded-[var(--radius-card)] bg-surface-muted/65 p-(--space-4) shadow-[var(--elevation-1)]"
              data-testid="savings-summary"
            >
              <Text size="sm" weight="semibold">
                {t("summaryTitle")}
              </Text>
              <Text size="sm" tone="secondary" className="mt-(--space-1)">
                {t("summaryCaption")}
              </Text>
              <div className="mt-(--space-4) flex items-end justify-between gap-(--space-3)">
                <Amount
                  label={t("principalTotal")}
                  amountLabel={formatCurrency(
                    model.totalPrincipal,
                    DEFAULT_CURRENCY,
                    locale,
                    { maximumFractionDigits: 0 },
                  )}
                  size="lg"
                />
                <div className="text-right">
                  <Text size="xs" tone="secondary">
                    {t("expectedNetInterest")}
                  </Text>
                  <Text size="lg" weight="semibold">
                    {formatCurrency(
                      model.expectedNetInterest,
                      DEFAULT_CURRENCY,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </Text>
                </div>
              </div>
              <div className="mt-(--space-4) grid grid-cols-2 gap-(--space-3) border-t border-border-subtle/70 pt-(--space-3)">
                <div>
                  <Text size="xs" tone="secondary">
                    {t("expectedReceived")}
                  </Text>
                  <Text size="sm" weight="semibold">
                    {formatCurrency(
                      model.expectedTotalCashReceived,
                      DEFAULT_CURRENCY,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                  </Text>
                </div>
                <div className="text-right">
                  <Text size="xs" tone="secondary">
                    {t("maturitySoon")}
                  </Text>
                  <Text size="sm" weight="semibold">
                    {t("maturitySummary", { count: model.attentionCount })}
                  </Text>
                </div>
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
              testId="savings-history-section"
            >
              <Text size="sm" tone="secondary">
                {t("historyCaption")}
              </Text>
              <ul className="flex flex-col gap-(--space-2)">
                {model.historyItems.map((entry) => (
                  <li key={entry.saving.id}>
                    <Link
                      href={moneySavingsPath(entry.saving.id)}
                      className="flex items-center justify-between gap-(--space-3) border-b border-border-subtle/70 py-(--space-3) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      data-testid={`savings-history-row-${entry.saving.id}`}
                    >
                      <span className="min-w-0">
                        <Text size="sm" weight="semibold" className="truncate">
                          {entry.saving.productName ||
                            entry.saving.providerName ||
                            t("fallbackName")}
                        </Text>
                        <Text size="xs" tone="secondary">
                          {t(`maturityState.${entry.maturityState}`)}
                        </Text>
                      </span>
                      <span className="shrink-0 text-sm font-medium">
                        {formatCurrency(
                          entry.principal,
                          entry.saving.productSnapshot.currency ??
                            DEFAULT_CURRENCY,
                          locale,
                          { maximumFractionDigits: 0 },
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </>
      )}
      <Link
        href={APP_PATH.MONEY}
        className="text-sm font-medium text-accent"
        data-testid="savings-back-money"
      >
        {tMoney("backToMoney")}
      </Link>
    </Page>
  );
}
