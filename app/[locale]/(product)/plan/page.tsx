import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Suspense } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { APP_LOCALE, routing } from "@/i18n/routing";
import {
  APP_PATH,
  PLAN_MONTH_QUERY,
  planJarPath,
} from "@/modules/tenancy/application/app-path";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getPlanPulse,
  getCurrentJarBudgets,
  getPlanBudgetHistory,
  listPlanBudgetHistoryMonths,
  listPlanHubUpcomingEvents,
  currentPeriodMonth,
  PlanAssistMode,
  RitualMode,
  JarBudgetState,
  JarKind,
  CalendarCashFlowSign,
  CalendarEventSource,
  DEFAULT_CURRENCY,
  PLAN_HUB_UPCOMING_DAYS,
  PLAN_HUB_UPCOMING_EVENT_LIMIT,
  summarizeJarBudgets,
  JAR_BUDGET_PERCENT_SCALE,
  PLAN_PERIOD_MONTH_PATTERN,
  type CalendarEvent,
  type JarBudgetMetrics,
  type PlanBudgetHistory,
} from "@/modules/plan/application";
import { listOpenInboxItems } from "@/modules/inbox/application";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/shared/i18n/formatters";
import {
  differenceInUtcCalendarDays,
  todayIsoDate,
} from "@/shared/utils/iso-date";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { MotionReveal } from "@/shared/motion/reveal";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { EmptyState } from "@/shared/patterns/empty-state";
import { JarCard } from "@/shared/patterns/jar-card";
import { StatusAlert } from "@/shared/ui/status-alert";
import { InlineAlert } from "@/shared/ui/inline-alert";
import { InlineAlertVariant } from "@/shared/ui/inline-alert-constants";
import { Text } from "@/shared/ui/text";
import { Progress } from "@/shared/ui/progress";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import {
  ACTION_ICONS,
  FINANCE_ICONS,
  PLAN_ICONS,
} from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { EmergencyInboxBanner } from "./emergency-inbox-banner";
import { PlanOfflineBanner } from "./plan-offline-banner";
import { PLAN_ACCENT_LINK_CLASS, PLAN_INLINE_LINK_CLASS } from "./plan-chrome";
import { PlanSectionTitle } from "./plan-section-title";
import { PlanHubHero } from "./plan-hub-hero";
import { PlanJarFilterList } from "./plan-jar-filter-list";
import {
  PlanDestinationCard,
  PlanDestinationRow,
  PlanDestinationTile,
} from "./plan-destination-row";
import {
  getPlanMonthProgress,
  isUpcomingDueEvent,
  PLAN_HUB_VISIBLE_JAR_LIMIT,
} from "./plan-hub-presentations";
import {
  jarBudgetProgressPercent,
  jarStateLabelKey,
  JAR_KIND_ICON_TONE,
} from "./jars/jar-presentations";
import {
  PlanContextSkeleton,
  PlanShortcutTilesFallback,
  PlanWorkRowSkeleton,
} from "./loading";
import { Skeleton } from "@/shared/ui/skeleton";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { cn } from "@/shared/utils/cn";
import { PlanPeriodSelect } from "./plan-period-select";
import { PlanHistorySummary } from "./plan-history-summary";
import { PlanPrivacyToggle } from "./plan-privacy-toggle";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [PLAN_MONTH_QUERY]?: string | string[] }>;
};
type LooseTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  rich: (
    key: string,
    values?: Record<
      string,
      string | number | ((chunks: ReactNode) => ReactNode)
    >,
  ) => ReactNode;
};

type PlanPulseValue = NonNullable<Awaited<ReturnType<typeof getPlanPulse>>>;
type PlanInboxResult = Awaited<ReturnType<typeof listOpenInboxItems>>;
type PlanHistoryJar = PlanBudgetHistory["jars"][number];
type PlanHubData = {
  tCatalog: LooseTranslator;
  tJars: LooseTranslator;
  inboxItems: PlanInboxResult;
  activeJars: PlanPulseValue["activeJars"];
  assistMode: PlanAssistMode;
  currency: string;
  currentPeriodMonth: string;
  periodMonth: string;
  periodIncome: number;
  budgetsByJar: Record<string, JarBudgetMetrics>;
  budgetSummary: ReturnType<typeof summarizeJarBudgets>;
  historyMonths: string[];
  historyJars: PlanHistoryJar[];
  isHistorical: boolean;
  historyAvailable: boolean;
  historyMissingJarSnapshotCount: number;
};

type PlanHubQueryPromises = {
  tCatalogPromise: ReturnType<typeof getTranslations>;
  tJarsPromise: ReturnType<typeof getTranslations>;
  pulsePromise: ReturnType<typeof getPlanPulse>;
  currentJarBudgetsPromise: ReturnType<typeof getCurrentJarBudgets>;
  historyMonthsPromise: ReturnType<typeof listPlanBudgetHistoryMonths>;
  inboxItemsPromise: ReturnType<typeof listOpenInboxItems>;
  historyPromise: Promise<PlanBudgetHistory | null>;
};

const PLAN_EVENT_ICON_BY_SOURCE: Record<
  CalendarEvent["source"],
  IconSvgElement
> = {
  [CalendarEventSource.RECURRING]: PLAN_ICONS.recurring,
  [CalendarEventSource.CARD_DUE]: FINANCE_ICONS.card,
  [CalendarEventSource.LOAN]: FINANCE_ICONS.loan,
  [CalendarEventSource.LIABILITY]: FINANCE_ICONS.debt,
  [CalendarEventSource.PAYOFF_MILESTONE]: FINANCE_ICONS.ledger,
};

function upcomingWithinDays(
  events: readonly CalendarEvent[],
  now = new Date(),
  days = PLAN_HUB_UPCOMING_DAYS,
  limit = PLAN_HUB_UPCOMING_EVENT_LIMIT,
): CalendarEvent[] {
  const start = now.toISOString().slice(0, 10);
  const endDate = new Date(now);
  endDate.setUTCDate(endDate.getUTCDate() + days);
  const end = endDate.toISOString().slice(0, 10);
  return events
    .filter((event) => event.date >= start && event.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

function formatPlanPeriod(
  periodMonth: string,
  locale: string,
  t: LooseTranslator,
): string {
  const date = new Date(`${periodMonth}T00:00:00Z`);
  return t("home.periodSelector", {
    month: formatDate(date, locale, {
      month: locale === APP_LOCALE.VIETNAMESE ? "numeric" : "long",
      timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    }),
    year: formatDate(date, locale, {
      year: "numeric",
      timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    }),
  });
}

async function resolvePlanHubData({
  tCatalogPromise,
  tJarsPromise,
  pulsePromise,
  currentJarBudgetsPromise,
  historyMonthsPromise,
  inboxItemsPromise,
  historyPromise,
  requestedMonth,
}: PlanHubQueryPromises & {
  requestedMonth?: string;
}): Promise<PlanHubData> {
  const [
    tCatalogValue,
    tJarsValue,
    pulse,
    currentJarBudgets,
    historyMonthsValue,
    inboxItems,
    history,
  ] = await Promise.all([
    tCatalogPromise,
    tJarsPromise,
    pulsePromise,
    currentJarBudgetsPromise,
    historyMonthsPromise,
    inboxItemsPromise,
    historyPromise,
  ]);
  const activeJars = (pulse?.activeJars ?? []).filter(
    (jar) => jar.kind !== JarKind.INCOME,
  );
  const historyMonths = historyMonthsValue ?? [];
  const currentMonth = currentJarBudgets?.periodMonth ?? currentPeriodMonth();
  const historyMonth =
    requestedMonth &&
    PLAN_PERIOD_MONTH_PATTERN.test(requestedMonth) &&
    requestedMonth < currentMonth
      ? requestedMonth
      : null;
  const isHistorical = historyMonth !== null;
  const selectedHistory = isHistorical ? history : null;
  const historyJars = selectedHistory?.jars ?? [];
  const budgetsByJar = isHistorical
    ? Object.fromEntries(historyJars.map((jar) => [jar.id, jar.metrics]))
    : (currentJarBudgets?.byJarId ?? {});
  const historyAvailable = !isHistorical || selectedHistory !== null;
  const periodMonth = historyMonth ?? currentMonth;
  const budgetSummary = isHistorical
    ? selectedHistory
      ? summarizeJarBudgets(
          historyJars.map((jar) => jar.id),
          budgetsByJar,
        )
      : null
    : currentJarBudgets
      ? summarizeJarBudgets(
          activeJars.map((jar) => jar.id),
          budgetsByJar,
        )
      : null;

  return {
    tCatalog: tCatalogValue as unknown as LooseTranslator,
    tJars: tJarsValue as unknown as LooseTranslator,
    inboxItems,
    activeJars,
    assistMode:
      pulse?.monthCloseMode === RitualMode.MANUAL
        ? PlanAssistMode.MANUAL
        : PlanAssistMode.ASSISTED,
    currency: selectedHistory?.currency ?? pulse?.currency ?? DEFAULT_CURRENCY,
    currentPeriodMonth: currentMonth,
    periodMonth,
    periodIncome: isHistorical
      ? (selectedHistory?.periodIncome ?? 0)
      : (currentJarBudgets?.periodIncome ?? 0),
    budgetsByJar,
    budgetSummary,
    historyMonths,
    historyJars,
    isHistorical,
    historyAvailable,
    historyMissingJarSnapshotCount:
      selectedHistory?.missingJarSnapshotCount ?? 0,
  };
}

function intentionAmount(value: string) {
  return (
    <FinancialValue>
      <span data-financial-kind={FinancialNumberKind.INTENTION}>{value}</span>
    </FinancialValue>
  );
}

async function PlanCriticalSection({
  locale,
  t,
  dataPromise,
}: {
  locale: string;
  t: LooseTranslator;
  dataPromise: Promise<PlanHubData>;
}) {
  const data = await dataPromise;
  const summary = data.budgetSummary;
  const amount = (value: number) =>
    formatCurrency(value, data.currency, locale, { maximumFractionDigits: 0 });
  const compactAmount = (value: number) =>
    formatCurrency(value, data.currency, locale, {
      notation: "compact",
      maximumFractionDigits: 2,
    });
  const incomeValue =
    data.periodIncome > 0
      ? amount(data.periodIncome)
      : t("home.factIncomeEmpty");
  const summaryUnavailable = t("home.summaryUnavailable");
  const periodJars = data.isHistorical
    ? data.historyJars.map((jar) => ({ ...jar }))
    : data.activeJars.flatMap((jar) => {
        const metrics = data.budgetsByJar[jar.id];
        return metrics ? [{ id: jar.id, name: jar.name, metrics }] : [];
      });
  const overBudgetJars = periodJars.filter(
    (jar) => jar.metrics.state === JarBudgetState.OVERSPENT,
  );
  const overBudgetJarSpend = overBudgetJars.reduce(
    (total, jar) => total + jar.metrics.spentAmount,
    0,
  );
  const overBudgetSpendShare =
    summary && summary.spentAmount > 0
      ? Math.min(100, (overBudgetJarSpend / summary.spentAmount) * 100)
      : null;
  const monthProgress = data.isHistorical
    ? null
    : getPlanMonthProgress(data.periodMonth, locale);
  const progressLabel = monthProgress
    ? t("home.dayProgress", {
        day: formatNumber(monthProgress.day, locale),
        days: formatNumber(monthProgress.days, locale),
        percent: formatNumber(monthProgress.percent, locale),
      })
    : undefined;
  const usagePercentLabel =
    summary && summary.budgetAmount > 0
      ? formatNumber(
          (summary.spentAmount / summary.budgetAmount) * 100,
          locale,
          { maximumFractionDigits: 1 },
        )
      : undefined;
  const usageLabel = usagePercentLabel
    ? t("home.monthlyUsage", { percent: usagePercentLabel })
    : undefined;
  const periodOptions = [
    ...new Set([
      data.currentPeriodMonth,
      data.periodMonth,
      ...data.historyMonths,
    ]),
  ].map((month) => ({
    value: month,
    label: formatPlanPeriod(month, locale, t),
    shortLabel: formatDate(new Date(`${month}T00:00:00Z`), locale, {
      month: "short",
      timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    }),
  }));

  return (
    <MotionReveal>
      <div className="flex flex-col gap-(--space-3)">
        <div className="flex flex-wrap items-center justify-between gap-(--space-2)">
          <PlanPeriodSelect
            label={t("home.periodSelectorLabel")}
            loadingLabel={t("home.periodLoading")}
            options={periodOptions}
            selectedMonth={data.periodMonth}
            historical={data.isHistorical}
            previousLabel={t("home.previousMonth")}
            nextLabel={t("home.nextMonth")}
          />
          {!data.isHistorical ? (
            <StatusBadge
              tone={
                data.isHistorical
                  ? StatusBadgeTone.NEUTRAL
                  : StatusBadgeTone.POSITIVE
              }
              className={cn(
                "min-h-8 shrink-0 px-(--space-3) text-xs",
                data.isHistorical
                  ? "border-border-subtle bg-surface-muted text-text-secondary"
                  : "border-primary/25 bg-primary/10 text-primary",
              )}
            >
              <AppIcon
                icon={
                  data.isHistorical ? PLAN_ICONS.lockedPeriod : PLAN_ICONS.jar
                }
                size={AppIconSize.XS}
              />
              {data.isHistorical
                ? t("home.historyReadOnly")
                : t(
                    data.assistMode === PlanAssistMode.MANUAL
                      ? "home.assistManual"
                      : "home.assistAssisted",
                  )}
            </StatusBadge>
          ) : null}
        </div>
        {data.isHistorical && !data.historyAvailable ? (
          <StatusAlert
            variant="warning"
            title={t("home.historyUnavailableTitle")}
            description={t("home.historyUnavailableBody")}
          />
        ) : (
          <>
            {data.isHistorical && data.historyMissingJarSnapshotCount > 0 ? (
              <StatusAlert
                variant="warning"
                title={t("home.historyIncompleteTitle")}
                description={
                  <span className="text-text-secondary">
                    {t("home.historyIncompleteBody", {
                      count: data.historyMissingJarSnapshotCount,
                    })}
                  </span>
                }
              />
            ) : null}
            {data.isHistorical ? (
              <PlanHistorySummary
                readOnlyLabel={t("home.historyReadOnly")}
                closedLabel={t("home.historyClosed")}
                notice={t("home.historyNotice")}
                metrics={[
                  {
                    label: t("home.historyPlanned"),
                    value: summary
                      ? compactAmount(summary.budgetAmount)
                      : summaryUnavailable,
                    detail: t("home.historyJarSummary", {
                      count: periodJars.length,
                    }),
                    testId: "plan-summary-planned",
                  },
                  {
                    label: t("home.historySpent"),
                    value: summary
                      ? compactAmount(summary.spentAmount)
                      : summaryUnavailable,
                    detail: usagePercentLabel
                      ? t("home.monthlyUsageDetail", {
                          percent: usagePercentLabel,
                        })
                      : undefined,
                    testId: "plan-summary-spent",
                  },
                  {
                    label: t("home.metricRemaining"),
                    value: summary
                      ? compactAmount(summary.remainingAmount)
                      : summaryUnavailable,
                    testId: "plan-summary-remaining",
                  },
                ]}
                usageLabel={usageLabel}
                usagePercent={summary?.usagePercent ?? null}
              />
            ) : (
              <PlanHubHero
                attentionLabel={t(
                  overBudgetJars.length > 0
                    ? "home.planAttention"
                    : "home.planOnTrack",
                  { count: overBudgetJars.length },
                )}
                attentionTone={
                  overBudgetJars.length > 0
                    ? StatusBadgeTone.WARNING
                    : StatusBadgeTone.POSITIVE
                }
                dayProgressLabel={progressLabel}
                dayProgressPercent={monthProgress?.percent ?? null}
                todayLabel={t("home.today")}
                activeJarSummary={
                  data.isHistorical
                    ? t("home.historyJarSummary", { count: periodJars.length })
                    : t("home.activeJarSummary", {
                        count: data.activeJars.length,
                      })
                }
                incomeLabel={t("home.factIncome")}
                incomeValue={incomeValue}
                usagePercent={summary?.usagePercent ?? null}
                usageLabel={usageLabel}
                overBudgetSpendShare={overBudgetSpendShare}
                plannedLabel={t("home.metricPlanned")}
                plannedValue={
                  summary ? amount(summary.budgetAmount) : summaryUnavailable
                }
                spentLabel={t("home.metricSpent")}
                spentValue={
                  summary ? amount(summary.spentAmount) : summaryUnavailable
                }
                spentDetail={
                  usagePercentLabel
                    ? t("home.monthlyUsageDetail", {
                        percent: usagePercentLabel,
                      })
                    : undefined
                }
                remainingLabel={t("home.metricRemaining")}
                remainingValue={
                  summary ? amount(summary.remainingAmount) : summaryUnavailable
                }
              />
            )}
          </>
        )}
      </div>
    </MotionReveal>
  );
}

async function PlanAttentionSection({
  locale,
  t,
  userId,
  dataPromise,
}: {
  locale: string;
  t: LooseTranslator;
  userId: string;
  dataPromise: Promise<PlanHubData>;
}) {
  const data = await dataPromise;
  if (data.isHistorical) return null;
  const overspent = data.activeJars.flatMap((jar) => {
    const metrics = data.budgetsByJar[jar.id];
    return metrics?.state === JarBudgetState.OVERSPENT
      ? [{ jar, metrics }]
      : [];
  });
  const first = overspent[0];
  const firstName = first
    ? localizeCatalogName(data.tCatalog, "jars", first.jar.name)
    : "";

  return (
    <>
      <EmergencyInboxBanner
        items={data.inboxItems ?? []}
        viewerUserId={userId}
        title={t("jars.reallocate.emergencyBannerTitle")}
        body={t("jars.reallocate.emergencyBannerBody")}
        openLabel={t("jars.reallocate.emergencyBannerOpen")}
      />
      {first ? (
        <InlineAlert
          variant={InlineAlertVariant.ERROR}
          title={
            first.metrics.budgetAmount > 0
              ? t.rich("home.overspentJarTitle", {
                  name: firstName,
                  amount: formatCurrency(
                    first.metrics.spentAmount - first.metrics.budgetAmount,
                    data.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  ),
                  money: (chunks: ReactNode) => (
                    <FinancialValue>{chunks}</FinancialValue>
                  ),
                })
              : t("home.overspentNoBudgetTitle", { name: firstName })
          }
          description={
            first.metrics.budgetAmount > 0 ? (
              <>
                {t.rich("home.overspentJarDetails", {
                  spent: formatCurrency(
                    first.metrics.spentAmount,
                    data.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  ),
                  planned: formatCurrency(
                    first.metrics.budgetAmount,
                    data.currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  ),
                  percent: formatNumber(
                    (first.metrics.spentAmount / first.metrics.budgetAmount) *
                      100,
                    locale,
                    { maximumFractionDigits: 1 },
                  ),
                  money: (chunks: ReactNode) => (
                    <FinancialValue>{chunks}</FinancialValue>
                  ),
                })}
                <p className="mt-(--space-1)">
                  {t("home.overspentReviewRemainingDays")}
                </p>
              </>
            ) : (
              t.rich("home.overspentNoBudgetBody", {
                name: localizeCatalogName(
                  data.tCatalog,
                  "jars",
                  first.jar.name,
                ),
                spent: formatCurrency(
                  first.metrics.spentAmount,
                  data.currency,
                  locale,
                  { maximumFractionDigits: 0 },
                ),
                money: (chunks: ReactNode) => (
                  <FinancialValue>{chunks}</FinancialValue>
                ),
              })
            )
          }
          action={
            <Link
              href={planJarPath(first.jar.id)}
              prefetch={PRODUCT_LINK_PREFETCH}
              className={cn(
                PLAN_INLINE_LINK_CLASS,
                "gap-(--space-1) text-primary",
              )}
              data-testid="plan-adjust-overspent-jar"
            >
              {t("home.adjustJarAllocation")}
              <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.XS} />
            </Link>
          }
          testId="plan-home-overspending"
        />
      ) : null}
    </>
  );
}

async function PlanJarsSection({
  locale,
  t,
  dataPromise,
}: {
  locale: string;
  t: LooseTranslator;
  dataPromise: Promise<PlanHubData>;
}) {
  const data = await dataPromise;
  const formatAmount = (value: number) =>
    formatCurrency(value, data.currency, locale, { maximumFractionDigits: 0 });
  const previewJars = data.activeJars.slice(0, PLAN_HUB_VISIBLE_JAR_LIMIT);

  const getJarStatusLabel = (metrics: JarBudgetMetrics | undefined) => {
    if (!metrics) return undefined;
    if (metrics.state === JarBudgetState.OVERSPENT) {
      return t("home.jarOverspentStatus");
    }
    if (metrics.budgetAmount <= 0) return t("home.jarNoBudgetStatus");

    return t("home.jarRemainingStatus", {
      percent: formatNumber(
        Math.max(0, JAR_BUDGET_PERCENT_SCALE - metrics.usagePercent),
        locale,
      ),
    });
  };

  if (data.isHistorical) {
    const historyTitle = (
      <PlanSectionTitle>
        <span className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
          {t("home.historyPerformance", {
            count: data.historyJars.length,
            period: formatPlanPeriod(data.periodMonth, locale, t),
          })}
        </span>
      </PlanSectionTitle>
    );
    if (!data.historyAvailable) return null;
    if (data.historyJars.length === 0) {
      return (
        <Section
          title={historyTitle}
          testId="plan-home-jars"
          contentClassName="gap-0"
        >
          <EmptyState
            title={t("home.historyJarsEmptyTitle")}
            description={t("home.historyJarsEmptyBody")}
            icon={<AppIcon icon={PLAN_ICONS.jar} />}
            className="flex-none py-(--space-4)"
          />
        </Section>
      );
    }
    return (
      <Section
        title={historyTitle}
        testId="plan-home-jars"
        contentClassName="gap-(--space-3)"
      >
        <Text size="xs" tone="secondary">
          {t("home.historyJarHealth", {
            overspent: data.historyJars.filter(
              (jar) => jar.metrics.state === JarBudgetState.OVERSPENT,
            ).length,
            total: data.historyJars.length,
          })}
        </Text>
        <Card tone="default" className="gap-0 overflow-hidden p-0">
          {data.historyJars.map((jar) => {
            const metrics = jar.metrics;
            const name = localizeCatalogName(data.tCatalog, "jars", jar.name);
            const usageLabel = t("home.jarUsage", {
              spent: formatAmount(metrics.spentAmount),
              planned: formatAmount(metrics.budgetAmount),
            });
            const statusLabel = getJarStatusLabel(metrics);
            const isOverspent = metrics.state === JarBudgetState.OVERSPENT;
            return (
              <div
                key={jar.id}
                className="flex flex-col gap-(--space-2) border-b border-divider-subtle p-(--space-3) last:border-b-0"
                data-testid={`plan-history-jar-${jar.id}`}
              >
                <div className="flex min-w-0 items-center gap-(--space-3)">
                  <IconContainer tone={IconContainerTone.NEUTRAL} size="sm">
                    <AppIcon icon={PLAN_ICONS.jar} />
                  </IconContainer>
                  <div className="min-w-0 flex-1">
                    <Text size="xs" weight="semibold" className="text-pretty">
                      {name}
                    </Text>
                    <Text size="xs" tone="secondary" className="mt-(--space-1)">
                      <FinancialValue>{usageLabel}</FinancialValue>
                    </Text>
                  </div>
                  <div className="max-w-1/2 shrink-0 text-right">
                    <Text
                      size="xs"
                      weight="semibold"
                      tone={isOverspent ? "danger" : "primary"}
                      tabular
                      data-financial-kind={FinancialNumberKind.INTENTION}
                    >
                      <FinancialValue>
                        {isOverspent
                          ? t("home.historyOverspentAmount", {
                              amount: formatAmount(
                                Math.abs(metrics.remainingAmount),
                              ),
                            })
                          : t("home.historyRemainingAmount", {
                              amount: formatAmount(metrics.remainingAmount),
                            })}
                      </FinancialValue>
                    </Text>
                    {statusLabel ? (
                      <Text
                        size="xs"
                        tone={isOverspent ? "danger" : "secondary"}
                        className="mt-(--space-1)"
                      >
                        {statusLabel}
                      </Text>
                    ) : null}
                  </div>
                </div>
                {metrics.budgetAmount > 0 ? (
                  <Progress
                    value={metrics.usagePercent}
                    label={usageLabel}
                    showLabel={false}
                    indicatorClassName={isOverspent ? "bg-danger" : undefined}
                    trackClassName="h-(--space-1)"
                    privacyAware
                  />
                ) : null}
              </div>
            );
          })}
        </Card>
        <div className="flex flex-col gap-(--space-2)">
          <Link
            href={{
              pathname: APP_PATH.PLAN_RITUAL,
              query: { [PLAN_MONTH_QUERY]: data.periodMonth },
            }}
            prefetch={PRODUCT_LINK_PREFETCH}
            className="flex min-h-11 items-center justify-center gap-(--space-2) rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-3) text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus-ring"
            data-testid="plan-history-review"
          >
            <AppIcon icon={PLAN_ICONS.monthlyReview} size={AppIconSize.SM} />
            {t("home.historyReview", {
              period: formatPlanPeriod(data.periodMonth, locale, t),
            })}
          </Link>
          <Link
            href={APP_PATH.PLAN}
            prefetch={PRODUCT_LINK_PREFETCH}
            className="flex min-h-11 items-center justify-center gap-(--space-1) text-xs font-medium text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
            data-testid="plan-history-current"
          >
            <AppIcon icon={ACTION_ICONS.back} size={AppIconSize.XS} />
            {t("home.historyCurrent", {
              period: formatPlanPeriod(data.currentPeriodMonth, locale, t),
            })}
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <Section contentClassName="gap-0" testId="plan-home-jars">
      {!data.budgetSummary ? (
        <StatusAlert
          variant="warning"
          title={t("home.jarsUnavailableTitle")}
          description={t("home.jarsUnavailableBody")}
        />
      ) : null}
      {data.activeJars.length === 0 ? (
        <EmptyState
          title={t("jars.emptyTitle")}
          description={t("jars.emptyDescription")}
          icon={<AppIcon icon={PLAN_ICONS.jar} />}
          action={
            <Link
              href={APP_PATH.PLAN_JARS}
              prefetch={PRODUCT_LINK_PREFETCH}
              className={PLAN_ACCENT_LINK_CLASS}
            >
              {t("home.createJar")}
            </Link>
          }
          className="flex-none py-(--space-4)"
        />
      ) : (
        <PlanJarFilterList
          locale={locale}
          title={t("home.jarSectionCount", { count: data.activeJars.length })}
          labels={{
            group: t("home.jarFilterAria"),
            all: t("home.jarFilterAll"),
            overspent: t("home.jarFilterOverspent"),
            remaining: t("home.jarFilterRemaining"),
            empty: t("home.jarFilterEmpty"),
            sort: t("home.jarSort"),
            sortByName: t("home.jarSortByName"),
            restoreSort: t("home.jarSortRestore"),
          }}
          items={previewJars.map((jar) => {
            const metrics = data.budgetsByJar[jar.id];
            const usagePercent =
              metrics && metrics.budgetAmount > 0
                ? jarBudgetProgressPercent(metrics)
                : undefined;
            const name = localizeCatalogName(data.tCatalog, "jars", jar.name);
            return {
              id: jar.id,
              sortName: name,
              budgetState: metrics?.state,
              hasRemaining: Boolean(metrics && metrics.remainingAmount > 0),
              content: (
                <Card tone="elevated" className="gap-0 overflow-hidden p-0">
                  <JarCard
                    compact
                    href={planJarPath(jar.id)}
                    name={name}
                    kindLabel={data.tJars(`kinds.${jar.kind}`)}
                    stateLabel={data.tJars(jarStateLabelKey(jar.state))}
                    state={jar.state}
                    amountLabel={
                      metrics ? (
                        <FinancialValue>
                          {metrics.remainingAmount < 0 ? "+" : ""}
                          {formatAmount(Math.abs(metrics.remainingAmount))}
                        </FinancialValue>
                      ) : undefined
                    }
                    secondaryLabel={getJarStatusLabel(metrics)}
                    usageLabel={
                      metrics
                        ? t("home.jarUsage", {
                            spent: formatAmount(metrics.spentAmount),
                            planned: formatAmount(metrics.budgetAmount),
                          })
                        : undefined
                    }
                    usagePercent={usagePercent}
                    budgetState={metrics?.state}
                    iconTone={JAR_KIND_ICON_TONE[jar.kind]}
                    data-testid={`plan-jar-${jar.id}`}
                  />
                </Card>
              ),
            };
          })}
        />
      )}
      {data.activeJars.length > previewJars.length ? (
        <Link
          href={APP_PATH.PLAN_JARS}
          prefetch={PRODUCT_LINK_PREFETCH}
          className={cn(
            PLAN_INLINE_LINK_CLASS,
            "mt-(--space-2) justify-center gap-(--space-2)",
          )}
          data-testid="plan-view-all-jars"
        >
          {t("home.viewAllJars")}
          <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.XS} />
        </Link>
      ) : null}
    </Section>
  );
}

async function PlanUpcomingSection({
  locale,
  t,
  dataPromise,
}: {
  locale: string;
  t: LooseTranslator;
  dataPromise: Promise<PlanHubData>;
}) {
  const data = await dataPromise;
  if (data.isHistorical) return null;
  const upcomingPreview = await listPlanHubUpcomingEvents();
  const currency = upcomingPreview?.currency ?? DEFAULT_CURRENCY;
  const upcoming = upcomingWithinDays(
    (upcomingPreview?.events ?? []).filter(
      (event) => event.cashFlowSign === CalendarCashFlowSign.OUTFLOW,
    ),
  );
  const today = todayIsoDate();

  return (
    <Section
      title={<PlanSectionTitle>{t("home.upcomingTitle")}</PlanSectionTitle>}
      description={t("home.upcomingDescription", {
        days: PLAN_HUB_UPCOMING_DAYS,
      })}
      testId="plan-home-upcoming"
    >
      {upcoming.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("home.upcomingEmpty")}
        </Text>
      ) : (
        <ul
          className="flex flex-col gap-(--space-2)"
          data-testid="plan-upcoming-outflows"
        >
          {upcoming.map((event) => {
            const due = isUpcomingDueEvent(event.source);
            const daysUntil = Math.max(
              0,
              differenceInUtcCalendarDays(today, event.date),
            );
            const countdown =
              daysUntil === 0
                ? t("home.upcomingToday")
                : t("home.upcomingCountdown", {
                    days: formatNumber(daysUntil, locale),
                  });
            const dateLabel = formatDate(
              new Date(`${event.date}T00:00:00Z`),
              locale,
              {
                day: "numeric",
                month: "short",
                timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
              },
            );

            return (
              <li
                key={event.id}
                className="min-w-0"
                data-testid={`plan-upcoming-event-${event.id}`}
              >
                <Card
                  tone="elevated"
                  className="flex min-w-0 flex-row items-center gap-(--space-3) p-(--space-3)"
                >
                  <IconContainer
                    tone={
                      due ? IconContainerTone.WARNING : IconContainerTone.INFO
                    }
                    size="md"
                  >
                    <AppIcon icon={PLAN_EVENT_ICON_BY_SOURCE[event.source]} />
                  </IconContainer>
                  <div className="min-w-0 flex-1">
                    <Text
                      size="sm"
                      weight="semibold"
                      className="line-clamp-2 text-pretty"
                    >
                      {event.title}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-(--space-1)">
                      {due ? t("home.upcomingDue") : t("home.upcomingExpected")}
                      {" · "}
                      {dateLabel}
                    </Text>
                  </div>
                  <div className="shrink-0 text-right">
                    <Text
                      size="sm"
                      weight="semibold"
                      tabular
                      data-financial-kind={FinancialNumberKind.INTENTION}
                    >
                      {intentionAmount(
                        formatCurrency(event.amount, currency, locale, {
                          maximumFractionDigits: 0,
                        }),
                      )}
                    </Text>
                    <StatusBadge
                      tone={
                        due ? StatusBadgeTone.WARNING : StatusBadgeTone.NEUTRAL
                      }
                      className="mt-(--space-1)"
                    >
                      {countdown}
                    </StatusBadge>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

async function PlanShortcutSections({
  locale,
  t,
  dataPromise,
}: {
  locale: string;
  t: LooseTranslator;
  dataPromise: Promise<PlanHubData>;
}) {
  const data = await dataPromise;
  if (data.isHistorical) return null;
  const periodMonth = data.periodMonth;
  const month = formatDate(new Date(`${periodMonth}T00:00:00Z`), locale, {
    month: locale === APP_LOCALE.VIETNAMESE ? "numeric" : "long",
    timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
  });

  return (
    <div
      className="grid grid-cols-2 gap-(--space-2)"
      data-testid="plan-shortcuts"
    >
      <PlanDestinationTile
        href={APP_PATH.PLAN_CALENDAR}
        testId="plan-shortcut-calendar"
        icon={PLAN_ICONS.calendar}
        label={t("home.calendarShortcutTitle")}
        meta={t("home.workspaceCalendarMeta")}
      />
      <PlanDestinationTile
        href={APP_PATH.PLAN_RITUAL}
        testId="plan-shortcut-review"
        icon={PLAN_ICONS.monthlyReview}
        label={t("home.monthlyReviewShortcutTitle", { month })}
        meta={t("home.monthlyReviewShortcutDescription")}
      />
    </div>
  );
}

async function PlanToolDestinations({
  t,
  dataPromise,
}: {
  t: LooseTranslator;
  dataPromise: Promise<PlanHubData>;
}) {
  const data = await dataPromise;
  if (data.isHistorical) return null;
  return (
    <PlanDestinationCard
      title={t("home.workspaceTitle")}
      testId="plan-ritual-cta"
    >
      <PlanDestinationRow
        href={APP_PATH.PLAN_GOALS}
        testId="plan-entry-goals"
        icon={PLAN_ICONS.goal}
        iconTone={IconContainerTone.INVESTMENT}
        label={t("home.goalsTitle")}
        meta={t("home.goalsEmptyBody")}
      />
      <PlanDestinationRow
        href={APP_PATH.PLAN_RECURRING}
        testId="plan-entry-recurring"
        icon={PLAN_ICONS.recurring}
        iconTone={IconContainerTone.TRANSFER}
        label={t("home.recurringLink")}
        meta={t("home.workspaceRecurringMeta")}
      />
    </PlanDestinationCard>
  );
}

async function PlanAllocationAction({
  dataPromise,
  t,
}: {
  dataPromise: Promise<PlanHubData>;
  t: LooseTranslator;
}) {
  const data = await dataPromise;
  if (data.isHistorical)
    return <PlanPrivacyToggle testId="plan-history-privacy" onSurface />;
  return (
    <Link
      href={APP_PATH.PLAN_JARS}
      prefetch={PRODUCT_LINK_PREFETCH}
      className={cn(
        PLAN_ACCENT_LINK_CLASS,
        "w-auto shrink-0 gap-(--space-1) rounded-full border border-primary/50 bg-transparent px-(--space-3) text-xs font-semibold text-primary shadow-none hover:bg-primary/10",
      )}
      data-testid="plan-allocate"
    >
      <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.XS} />
      {t("home.allocate")}
    </Link>
  );
}

function PlanJarsFallback() {
  return (
    <Section title={<Skeleton className="h-4 w-32" />}>
      <Card tone="elevated" className="gap-0 p-0">
        <PlanWorkRowSkeleton />
        <PlanWorkRowSkeleton />
      </Card>
    </Section>
  );
}

function PlanUpcomingFallback() {
  return (
    <Section
      title={<Skeleton className="h-4 w-40" />}
      description={<Skeleton className="h-3 w-52" />}
      testId="plan-home-upcoming"
    >
      <div className="flex flex-col gap-(--space-2)">
        <Card tone="elevated" className="gap-0 p-0">
          <PlanWorkRowSkeleton />
        </Card>
        <Card tone="elevated" className="gap-0 p-0">
          <PlanWorkRowSkeleton />
        </Card>
      </div>
    </Section>
  );
}

function PlanAttentionFallback() {
  return (
    <div
      className="rounded-(--radius-control) border border-warning/30 bg-warning/10 p-(--space-4)"
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-(--space-2) h-4 w-3/4" />
    </div>
  );
}

/** Plan hub: live jar intention totals, jar status, and upcoming outflows. */
export default async function PlanHubPage({ params, searchParams }: Props) {
  const [{ locale: rawLocale }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });
  const queryMonth = query[PLAN_MONTH_QUERY];
  const requestedMonth =
    typeof queryMonth === "string" ? queryMonth : undefined;
  const isHistoricalRequest =
    requestedMonth !== undefined &&
    PLAN_PERIOD_MONTH_PATTERN.test(requestedMonth) &&
    requestedMonth < currentPeriodMonth();

  const tPromise = getTranslations("plan");
  const tCatalogPromise = getTranslations("catalog");
  const tJarsPromise = getTranslations("plan.jars");
  const pulsePromise = isHistoricalRequest
    ? Promise.resolve(null)
    : getPlanPulse();
  const currentJarBudgetsPromise = isHistoricalRequest
    ? Promise.resolve(null)
    : getCurrentJarBudgets();
  const historyMonthsPromise = listPlanBudgetHistoryMonths();
  const inboxItemsPromise = isHistoricalRequest
    ? Promise.resolve([])
    : listOpenInboxItems();
  const historyPromise = isHistoricalRequest
    ? getPlanBudgetHistory(requestedMonth)
    : Promise.resolve(null);
  const planTranslation = await tPromise;
  const t = planTranslation as unknown as LooseTranslator;
  const dataPromise = resolvePlanHubData({
    tCatalogPromise,
    tJarsPromise,
    pulsePromise,
    currentJarBudgetsPromise,
    historyMonthsPromise,
    inboxItemsPromise,
    historyPromise,
    requestedMonth,
  });

  return (
    <Page
      testId="plan-hub"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.PRIMARY}
          title={
            <div className="flex flex-wrap items-center gap-(--space-2)">
              <h1 className="text-xl font-bold tracking-tight">
                {t("home.title")}
              </h1>
              {isHistoricalRequest ? (
                <StatusBadge tone={StatusBadgeTone.NEUTRAL}>
                  {t("home.historyTitle")}
                </StatusBadge>
              ) : null}
            </div>
          }
          subtitle={t("home.subtitle")}
          trailing={
            <Suspense fallback={null}>
              <PlanAllocationAction dataPromise={dataPromise} t={t} />
            </Suspense>
          }
        />
      }
      contentClassName="pt-(--space-1)"
    >
      <PlanOfflineBanner />
      <Suspense fallback={<PlanContextSkeleton />}>
        <PlanCriticalSection locale={locale} t={t} dataPromise={dataPromise} />
      </Suspense>
      <Suspense fallback={<PlanAttentionFallback />}>
        <PlanAttentionSection
          locale={locale}
          t={t}
          userId={user.id}
          dataPromise={dataPromise}
        />
      </Suspense>
      <Suspense fallback={<PlanJarsFallback />}>
        <PlanJarsSection locale={locale} t={t} dataPromise={dataPromise} />
      </Suspense>
      <PlanToolDestinations t={t} dataPromise={dataPromise} />
      <Suspense fallback={<PlanUpcomingFallback />}>
        <PlanUpcomingSection locale={locale} t={t} dataPromise={dataPromise} />
      </Suspense>
      <Suspense fallback={<PlanShortcutTilesFallback />}>
        <PlanShortcutSections locale={locale} t={t} dataPromise={dataPromise} />
      </Suspense>
    </Page>
  );
}
