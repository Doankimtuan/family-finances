import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  planJarPath,
  planGoalPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getPlanPulse,
  getCurrentJarBudgets,
  getHouseholdCalendar,
  listGoals,
  currentPeriodMonth,
  PlanAssistMode,
  RitualMode,
  calculateAllocationHealth,
  AllocationHealthStatus,
  JarBudgetState,
  JarKind,
  DEFAULT_CURRENCY,
  QualifyingIncomeSource,
} from "@/modules/plan/application";
import {
  collectPlanHomeExceptions,
  prioritizePlanHomeExceptions,
  resolvePlanHomeHealth,
  PlanHomeExceptionKind,
  type PlanHomeException,
} from "@/modules/plan/application/plan-home-health";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { InboxItemKind } from "@/modules/inbox/application/inbox-constants";
import { GoalStatus } from "@/modules/plan/application/plan-constants";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
import { MotionReveal } from "@/shared/motion/reveal";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { JarCard } from "@/shared/patterns/jar-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { EmergencyInboxBanner } from "./emergency-inbox-banner";
import { PlanOfflineBanner } from "./plan-offline-banner";
import { RecommendationList } from "./recommendation-list";
import {
  PLAN_ACCENT_LINK_CLASS,
  PLAN_INLINE_LINK_CLASS,
  PLAN_SURFACE_LINK_CLASS,
} from "./plan-chrome";
import { PlanSectionTitle } from "./plan-section-title";
import { PlanHubHero } from "./plan-hub-hero";
import { PlanHubExceptions } from "./plan-hub-exceptions";
import {
  PlanDestinationCard,
  PlanDestinationRow,
} from "./plan-destination-row";
import {
  allocationFactTone,
  allocationFactValue,
  isUpcomingDueEvent,
  PLAN_HUB_VISIBLE_JAR_LIMIT,
  RecommendationListVariant,
  resolvePlanHealthCopy,
} from "./plan-hub-presentations";
import {
  getPlanRecommendations,
  type PlanRecommendation,
} from "@/modules/plan/application/plan-recommendations";

type Props = { params: Promise<{ locale: string }> };
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

type HomeGoal = {
  id: string;
  name: string;
  status: string;
  targetDate: string | null;
  targetAmount: number;
  fundedAmount: number;
  progressPercent: number | null;
  isLegacyIntention?: boolean;
};

type HomeEvent = {
  id?: string;
  date: string;
  title: string;
  amount: number;
  source?: string;
};

function pickHomeGoals(goals: readonly HomeGoal[], limit = 3): HomeGoal[] {
  return [...goals]
    .filter(
      (goal) =>
        goal.status === GoalStatus.ACTIVE || goal.status === GoalStatus.READY,
    )
    .sort((a, b) => {
      const aDate = a.targetDate ?? "9999-12-31";
      const bDate = b.targetDate ?? "9999-12-31";
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return (
        (a.progressPercent ?? Number.POSITIVE_INFINITY) -
        (b.progressPercent ?? Number.POSITIVE_INFINITY)
      );
    })
    .slice(0, limit);
}

function upcomingWithinDays(
  events: readonly HomeEvent[],
  now = new Date(),
  days = 7,
  limit = 3,
): HomeEvent[] {
  const start = now.toISOString().slice(0, 10);
  const endDate = new Date(now);
  endDate.setUTCDate(endDate.getUTCDate() + days);
  const end = endDate.toISOString().slice(0, 10);
  return events
    .filter((event) => event.date >= start && event.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

function formatPlanPeriod(periodMonth: string, locale: string): string {
  return formatDate(new Date(`${periodMonth}T00:00:00Z`), locale, {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function formatGoalDate(date: string | null, locale: string): string | null {
  if (!date) return null;
  return formatDate(new Date(`${date}T00:00:00Z`), locale, {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function exceptionTitle(
  exception: PlanHomeException,
  t: (key: string, values?: Record<string, string | number>) => string,
  tCatalog: (key: string, values?: Record<string, string | number>) => string,
) {
  const name = exception.jarName
    ? localizeCatalogName(tCatalog, "jars", exception.jarName)
    : undefined;
  switch (exception.kind) {
    case PlanHomeExceptionKind.OVERSPENT_JAR:
      return t("home.exceptionOverspent", { name: name ?? "Jar" });
    case PlanHomeExceptionKind.UNCATEGORIZED:
      return t("home.exceptionUncategorized", {
        count: exception.count ?? 0,
      });
    case PlanHomeExceptionKind.NO_INCOME:
      return t("home.exceptionNoIncome");
    case PlanHomeExceptionKind.OVER_ALLOCATED:
      return t("home.exceptionOverAllocated", {
        percent: exception.percent ?? 0,
      });
    case PlanHomeExceptionKind.GOAL_BACKING:
      return t("home.exceptionGoalBacking", {
        name: exception.goalName ?? t("home.goalFallbackName"),
      });
    case PlanHomeExceptionKind.NEAR_LIMIT_JAR:
      return t("home.exceptionNearLimit", { name: name ?? "Jar" });
  }
}

function exceptionDescription(
  exception: PlanHomeException,
  t: LooseTranslator,
  currency: string,
  locale: string,
) {
  if (exception.kind === PlanHomeExceptionKind.OVERSPENT_JAR) {
    return t.rich("home.exceptionOverspentBody", {
      amount: formatCurrency(exception.amount ?? 0, currency, locale, {
        maximumFractionDigits: 0,
      }),
      money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
    });
  }
  if (exception.kind === PlanHomeExceptionKind.NEAR_LIMIT_JAR) {
    return t.rich("home.exceptionNearLimitBody", {
      amount: formatCurrency(exception.amount ?? 0, currency, locale, {
        maximumFractionDigits: 0,
      }),
      money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
    });
  }
  return undefined;
}

function exceptionAction(
  exception: PlanHomeException,
  t: (key: string) => string,
) {
  if (
    exception.kind === PlanHomeExceptionKind.OVERSPENT_JAR ||
    exception.kind === PlanHomeExceptionKind.NEAR_LIMIT_JAR
  ) {
    return t("home.exceptionOpenJar");
  }
  if (exception.kind === PlanHomeExceptionKind.UNCATEGORIZED) {
    return t("home.exceptionOpenInbox");
  }
  if (exception.kind === PlanHomeExceptionKind.GOAL_BACKING) {
    return t("home.exceptionOpenGoal");
  }
  return t("home.exceptionOpenPlan");
}

/** Plan Home V2: current intention, exceptions, usage, progress, and commitments. */
export default async function PlanHubPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [
    t,
    tCatalog,
    pulse,
    currentJarBudgets,
    inboxItems,
    goalsList,
    calendar,
  ] = await Promise.all([
    getTranslations("plan"),
    getTranslations("catalog"),
    getPlanPulse(),
    getCurrentJarBudgets(),
    listOpenInboxItems(),
    listGoals(),
    getHouseholdCalendar(),
  ]);

  const activeJars = (pulse?.activeJars ?? []).filter(
    (jar) => jar.kind !== JarKind.INCOME,
  );
  const assistMode =
    pulse?.monthCloseMode === RitualMode.MANUAL
      ? PlanAssistMode.MANUAL
      : PlanAssistMode.ASSISTED;
  const currency = pulse?.currency ?? DEFAULT_CURRENCY;
  const periodMonth = currentJarBudgets?.periodMonth ?? currentPeriodMonth();
  const periodLabel = formatPlanPeriod(periodMonth, locale);
  const uncategorizedCount = (inboxItems ?? []).filter(
    (item) => item.kind === InboxItemKind.UNMAPPED_EXPENSE,
  ).length;
  const budgetsByJar = currentJarBudgets?.byJarId ?? {};
  const visibleBudgets = activeJars
    .map((jar) => budgetsByJar[jar.id])
    .filter((budget): budget is NonNullable<typeof budget> => Boolean(budget));
  const health = resolvePlanHomeHealth({
    activeJarCount: activeJars.length,
    budgets: visibleBudgets,
    uncategorizedCount,
  });
  const allocationHealth = calculateAllocationHealth(
    activeJars,
    currentJarBudgets?.periodIncome ?? 0,
  );
  const rawGoals = goalsList?.goals ?? [];
  const homeGoals = pickHomeGoals(rawGoals);
  const goalsMissingBacking = rawGoals.filter(
    (goal) =>
      (goal.status === GoalStatus.ACTIVE || goal.status === GoalStatus.READY) &&
      Boolean(goal.isLegacyIntention),
  );
  const allExceptions: PlanHomeException[] = [
    ...collectPlanHomeExceptions({
      budgetsByJar,
      jars: activeJars,
      uncategorizedCount,
    }),
  ];
  if (allocationHealth.status === AllocationHealthStatus.NO_INCOME) {
    allExceptions.push({ kind: PlanHomeExceptionKind.NO_INCOME });
  } else if (
    allocationHealth.status === AllocationHealthStatus.OVER_ALLOCATED
  ) {
    allExceptions.push({
      kind: PlanHomeExceptionKind.OVER_ALLOCATED,
      percent: allocationHealth.utilizationPercent,
    });
  }
  for (const goal of goalsMissingBacking) {
    allExceptions.push({
      kind: PlanHomeExceptionKind.GOAL_BACKING,
      goalId: goal.id,
      goalName: goal.name,
    });
  }
  const exceptions = prioritizePlanHomeExceptions(allExceptions);
  const recommendations = getPlanRecommendations({
    assistMode,
    periodMonth,
    jars: activeJars,
    budgetsByJar,
    qualifyingIncome: currentJarBudgets?.periodIncome ?? 0,
    uncategorizedCount,
    goals: rawGoals,
    limit: 3,
  });
  const jarNames = Object.fromEntries(
    activeJars.map((jar) => [
      jar.id,
      localizeCatalogName(tCatalog, "jars", jar.name),
    ]),
  );
  const goalNames = Object.fromEntries(
    rawGoals.map((goal) => [goal.id, goal.name]),
  );
  const recommendationHref = (recommendation: PlanRecommendation) => {
    const action = recommendation.action;
    if (!action) return APP_PATH.PLAN;
    if (action.type === "review_transactions")
      return APP_PATH.MONEY_TRANSACTIONS;
    if (action.type === "plan_settings") return APP_PATH.PLAN;
    if (action.entityType === "goal" && action.entityId)
      return planGoalPath(action.entityId);
    if (action.entityType === "jar") {
      const sourceJarId = action.payload?.sourceJarId;
      return planJarPath(
        typeof sourceJarId === "string" ? sourceJarId : (action.entityId ?? ""),
      );
    }
    if (action.entityType === "recurring" && action.entityId)
      return `${APP_PATH.PLAN_RECURRING}/${action.entityId}`;
    return APP_PATH.PLAN;
  };
  const upcoming = upcomingWithinDays((calendar?.events ?? []) as HomeEvent[]);
  const overspentCount = visibleBudgets.filter(
    (budget) => budget.state === JarBudgetState.OVERSPENT,
  ).length;
  const firstExceptionTitle = exceptions[0]
    ? exceptionTitle(
        exceptions[0],
        t as unknown as LooseTranslator,
        tCatalog as unknown as LooseTranslator,
      )
    : t("home.attentionFallback");
  const { title: healthTitle, body: healthBody } = resolvePlanHealthCopy(
    health,
    t as unknown as LooseTranslator,
    firstExceptionTitle,
    overspentCount,
  );
  const periodIncome = currentJarBudgets?.periodIncome ?? 0;

  return (
    <Page
      testId="plan-hub"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <PlanOfflineBanner />
      <EmergencyInboxBanner
        items={inboxItems ?? []}
        viewerUserId={user.id}
        title={t("jars.reallocate.emergencyBannerTitle")}
        body={t("jars.reallocate.emergencyBannerBody")}
        openLabel={t("jars.reallocate.emergencyBannerOpen")}
      />

      <MotionReveal>
        <PlanHubHero
          periodCaption={t("period.label")}
          periodLabel={periodLabel}
          assistLabel={t(
            assistMode === PlanAssistMode.MANUAL
              ? "home.assistManual"
              : "home.assistAssisted",
          )}
          health={health}
          healthTitle={healthTitle}
          healthBody={healthBody}
          facts={[
            {
              label: t("home.factJars"),
              value: t("home.factJarsValue", { count: activeJars.length }),
            },
            {
              label: t("home.factAllocation"),
              value: allocationFactValue(
                allocationHealth,
                t as unknown as LooseTranslator,
              ),
              tone: allocationFactTone(allocationHealth.status),
            },
            {
              label: t("home.factIncome"),
              value:
                periodIncome > 0 ? (
                  <FinancialValue>
                    {formatCurrency(periodIncome, currency, locale, {
                      maximumFractionDigits: 0,
                    })}
                  </FinancialValue>
                ) : (
                  t("home.factIncomeEmpty")
                ),
            },
          ]}
        />
      </MotionReveal>

      <PlanHubExceptions
        title={t("home.exceptionsTitle")}
        exceptions={exceptions}
        hiddenCount={allExceptions.length - exceptions.length}
        viewAllHref={APP_PATH.PLAN_JARS}
        viewAllLabel={t("home.viewAll")}
        renderTitle={(exception) =>
          exceptionTitle(
            exception,
            t as unknown as LooseTranslator,
            tCatalog as unknown as LooseTranslator,
          )
        }
        renderDescription={(exception) =>
          exceptionDescription(
            exception,
            t as unknown as LooseTranslator,
            currency,
            locale,
          )
        }
        renderAction={(exception) =>
          exceptionAction(exception, t as unknown as LooseTranslator)
        }
      />

      <Section
        title={<PlanSectionTitle>{t("jars.title")}</PlanSectionTitle>}
        description={t("jars.subtitle")}
        action={
          <Link
            href={APP_PATH.PLAN_JARS}
            className={PLAN_INLINE_LINK_CLASS}
            data-testid="plan-see-jars"
          >
            {t("home.viewAll")}
          </Link>
        }
        testId="plan-home-jars"
      >
        {!currentJarBudgets && activeJars.length > 0 ? (
          <StatusAlert
            variant="warning"
            title={t("home.jarsUnavailableTitle")}
            description={t("home.jarsUnavailableBody")}
          />
        ) : null}
        {activeJars.length === 0 ? (
          <EmptyState
            title={t("jars.emptyTitle")}
            description={t("jars.emptyDescription")}
            action={
              <Link
                href={APP_PATH.PLAN_JARS}
                className={PLAN_ACCENT_LINK_CLASS}
              >
                {t("home.createJar")}
              </Link>
            }
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {activeJars.slice(0, PLAN_HUB_VISIBLE_JAR_LIMIT).map((jar) => {
              const metrics = budgetsByJar[jar.id];
              const isNoIncome =
                metrics?.state === JarBudgetState.NO_BUDGET &&
                metrics.incomeSource === QualifyingIncomeSource.NONE;
              const remainingLabel = metrics ? (
                metrics.state === JarBudgetState.OVERSPENT ? (
                  t.rich("jars.budget.overBy", {
                    amount: formatCurrency(
                      Math.abs(metrics.remainingAmount),
                      currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })
                ) : isNoIncome ? (
                  <span>{t("jars.budget.setIncome")}</span>
                ) : (
                  t.rich("jars.budget.remaining", {
                    amount: formatCurrency(
                      metrics.remainingAmount,
                      currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    ),
                    money: (chunks: ReactNode) => (
                      <FinancialValue>{chunks}</FinancialValue>
                    ),
                  })
                )
              ) : undefined;
              return (
                <li key={jar.id}>
                  <Link
                    href={planJarPath(jar.id)}
                    className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <JarCard
                      name={localizeCatalogName(tCatalog, "jars", jar.name)}
                      kindLabel={t(`jars.kinds.${jar.kind}`)}
                      stateLabel={t("jars.stateActive")}
                      state={jar.state}
                      budgetHeading={t("jars.budget.heading")}
                      spentHeading={t("jars.spentLabel")}
                      budgetLabel={
                        metrics ? (
                          formatCurrency(
                            metrics.budgetAmount,
                            currency,
                            locale,
                            {
                              maximumFractionDigits: 0,
                            },
                          )
                        ) : (
                          <span>{t("jars.budget.notAvailable")}</span>
                        )
                      }
                      spentLabel={
                        metrics ? (
                          formatCurrency(
                            metrics.spentAmount,
                            currency,
                            locale,
                            {
                              maximumFractionDigits: 0,
                            },
                          )
                        ) : (
                          <span>{t("jars.budget.notAvailable")}</span>
                        )
                      }
                      remainingLabel={remainingLabel}
                      usageLabel={
                        metrics ? (
                          t("jars.budget.used", {
                            percent: metrics.usagePercent,
                          })
                        ) : (
                          <span>{t("jars.budget.notAvailable")}</span>
                        )
                      }
                      usagePercent={metrics?.usagePercent}
                      budgetState={metrics?.state}
                      data-testid={`plan-jar-${jar.id}`}
                      className="gap-(--space-3) p-(--space-3)"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {activeJars.length > PLAN_HUB_VISIBLE_JAR_LIMIT ? (
          <Link href={APP_PATH.PLAN_JARS} className={PLAN_INLINE_LINK_CLASS}>
            {t("home.viewAllJars", { count: activeJars.length })}
          </Link>
        ) : null}
      </Section>

      <Section
        title={<PlanSectionTitle>{t("home.goalsTitle")}</PlanSectionTitle>}
        action={
          <Link
            href={APP_PATH.PLAN_GOALS}
            className={PLAN_INLINE_LINK_CLASS}
            data-testid="plan-see-goals"
          >
            {t("home.viewAll")}
          </Link>
        }
        testId="plan-home-goals"
      >
        {homeGoals.length === 0 ? (
          <EmptyState
            title={t("home.goalsEmptyTitle")}
            description={t("home.goalsEmptyBody")}
            icon={<AppIcon icon={PLAN_ICONS.goal} size={AppIconSize.DISPLAY} />}
            action={
              <Link
                href={APP_PATH.PLAN_GOALS}
                className={PLAN_SURFACE_LINK_CLASS}
              >
                {t("home.createGoal")}
              </Link>
            }
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {homeGoals.map((goal) => {
              const targetDate = formatGoalDate(goal.targetDate, locale);
              return (
                <li key={goal.id}>
                  <Link
                    href={planGoalPath(goal.id)}
                    className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    data-testid={`plan-home-goal-${goal.id}`}
                  >
                    <Card
                      tone="interactive"
                      className="gap-(--space-3) p-(--space-3)"
                    >
                      <div className="flex flex-col items-start gap-(--space-2)">
                        <Text
                          size="sm"
                          className="w-full break-words font-semibold leading-snug text-text-primary"
                        >
                          {goal.name}
                        </Text>
                        <StatusBadge
                          tone={goal.isLegacyIntention ? "warning" : "info"}
                        >
                          {goal.isLegacyIntention
                            ? t("home.goalLegacy")
                            : t("home.goalLinked")}
                        </StatusBadge>
                      </div>
                      {goal.progressPercent == null ? (
                        <Text size="sm" tone="secondary">
                          {t("home.goalProgressIndeterminate")}
                        </Text>
                      ) : (
                        <Progress
                          value={goal.progressPercent}
                          max={100}
                          label={`${goal.progressPercent}%`}
                          privacyAware
                        />
                      )}
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-(--space-3) border-t border-divider pt-(--space-3)">
                        <Text
                          size="sm"
                          tone="secondary"
                          className="min-w-0 break-words tabular-nums leading-snug"
                        >
                          {goal.progressPercent == null
                            ? t("home.goalProgressIndeterminate")
                            : t.rich("home.goalProgress", {
                                funded: formatCurrency(
                                  goal.fundedAmount,
                                  currency,
                                  locale,
                                  { maximumFractionDigits: 0 },
                                ),
                                target: formatCurrency(
                                  goal.targetAmount,
                                  currency,
                                  locale,
                                  { maximumFractionDigits: 0 },
                                ),
                                moneyFunded: (chunks: ReactNode) => (
                                  <FinancialValue>{chunks}</FinancialValue>
                                ),
                                moneyTarget: (chunks: ReactNode) => (
                                  <FinancialValue>{chunks}</FinancialValue>
                                ),
                                percent: goal.progressPercent,
                              })}
                        </Text>
                        {targetDate ? (
                          <Text
                            size="xs"
                            tone="secondary"
                            className="shrink-0 text-right whitespace-nowrap"
                          >
                            {targetDate}
                          </Text>
                        ) : null}
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <RecommendationList
        recommendations={recommendations}
        t={t as unknown as LooseTranslator}
        resolveHref={recommendationHref}
        jarNames={jarNames}
        goalNames={goalNames}
        currency={currency}
        locale={locale}
        variant={RecommendationListVariant.SUPPORTING}
        testId="plan-home-recommendations"
      />

      <Section
        title={<PlanSectionTitle>{t("home.upcomingTitle")}</PlanSectionTitle>}
        action={
          <Link
            href={APP_PATH.PLAN_CALENDAR}
            className={PLAN_INLINE_LINK_CLASS}
            data-testid="plan-see-calendar"
          >
            {t("calendar.cta")}
          </Link>
        }
        testId="plan-home-upcoming"
      >
        {upcoming.length === 0 ? (
          <Text size="sm" tone="secondary">
            {t("home.upcomingEmpty")}
          </Text>
        ) : (
          <Card tone="elevated" className="gap-0 overflow-hidden p-0">
            <ul className="divide-y divide-divider">
              {upcoming.map((event) => (
                <li
                  key={event.id ?? `${event.date}-${event.title}`}
                  className="flex items-start gap-(--space-3) px-(--space-4) py-(--space-3)"
                >
                  <div className="min-w-0 flex-1">
                    <Text size="xs" tone="muted">
                      {formatDate(new Date(`${event.date}T00:00:00Z`), locale, {
                        day: "numeric",
                        month: "short",
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </Text>
                    <Text
                      size="sm"
                      weight="medium"
                      className="mt-(--space-1) line-clamp-2 text-pretty"
                    >
                      {event.title}
                    </Text>
                  </div>
                  <div className="shrink-0 text-right">
                    <Text size="sm" weight="semibold" tabular>
                      <FinancialValue>
                        {formatCurrency(event.amount, currency, locale, {
                          maximumFractionDigits: 0,
                        })}
                      </FinancialValue>
                    </Text>
                    <Text size="xs" tone="secondary">
                      {isUpcomingDueEvent(event.source)
                        ? t("home.upcomingDue")
                        : t("home.upcomingExpected")}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>

      <PlanDestinationCard
        title={t("home.workspaceTitle")}
        testId="plan-ritual-cta"
      >
        <PlanDestinationRow
          href={APP_PATH.PLAN_RECURRING}
          testId="plan-workspace-recurring"
          icon={PLAN_ICONS.recurring}
          iconTone={IconContainerTone.TRANSFER}
          label={t("home.recurringLink")}
          meta={t("home.workspaceRecurringMeta")}
        />
        <PlanDestinationRow
          href={APP_PATH.PLAN_RITUAL}
          testId="plan-ritual-open"
          icon={PLAN_ICONS.ritual}
          iconTone={IconContainerTone.PRIMARY}
          label={t("review.title")}
          meta={t("home.workspaceRitualMeta")}
        />
      </PlanDestinationCard>

      <div
        data-testid="plan-teaching"
        className="flex flex-col gap-(--space-2) border-t border-border-subtle pt-(--space-3)"
      >
        <Text size="sm" tone="secondary" className="text-pretty">
          {t("teaching.body")}
        </Text>
        <div className="flex flex-wrap items-center gap-x-(--space-2) gap-y-(--space-1)">
          <Link
            href={APP_PATH.MONEY}
            className={PLAN_INLINE_LINK_CLASS}
            data-testid="plan-money-link"
          >
            {t("moneyLink")}
          </Link>
          <Link
            href={APP_PATH.PLAN_GOALS}
            className={PLAN_INLINE_LINK_CLASS}
            data-testid="plan-entry-goals"
          >
            {t("home.goalsSeeAll")}
          </Link>
          <Link
            href={APP_PATH.PLAN_RECURRING}
            className={PLAN_INLINE_LINK_CLASS}
            data-testid="plan-entry-recurring"
          >
            {t("home.recurringLink")}
          </Link>
        </div>
      </div>
    </Page>
  );
}
