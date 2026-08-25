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
  JarKind,
} from "@/modules/plan/application";
import {
  collectPlanHomeExceptions,
  prioritizePlanHomeExceptions,
  resolvePlanHomeHealth,
  PlanHomeHealthStatus,
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
import { EmergencyInboxBanner } from "./emergency-inbox-banner";
import { PlanOfflineBanner } from "./plan-offline-banner";
import { RecommendationList } from "./recommendation-list";
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
    case "overspent_jar":
      return t("home.exceptionOverspent", { name: name ?? "Jar" });
    case "uncategorized":
      return t("home.exceptionUncategorized", {
        count: exception.count ?? 0,
      });
    case "no_income":
      return t("home.exceptionNoIncome");
    case "over_allocated":
      return t("home.exceptionOverAllocated", {
        percent: exception.percent ?? 0,
      });
    case "goal_backing":
      return t("home.exceptionGoalBacking", {
        name: exception.goalName ?? t("home.goalFallbackName"),
      });
    case "near_limit_jar":
      return t("home.exceptionNearLimit", { name: name ?? "Jar" });
  }
}

function exceptionDescription(
  exception: PlanHomeException,
  t: LooseTranslator,
  currency: string,
  locale: string,
) {
  if (exception.kind === "overspent_jar") {
    return t.rich("home.exceptionOverspentBody", {
      amount: formatCurrency(exception.amount ?? 0, currency, locale, {
        maximumFractionDigits: 0,
      }),
      money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
    });
  }
  if (exception.kind === "near_limit_jar") {
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
    exception.kind === "overspent_jar" ||
    exception.kind === "near_limit_jar"
  ) {
    return t("home.exceptionOpenJar");
  }
  if (exception.kind === "uncategorized") return t("home.exceptionOpenInbox");
  if (exception.kind === "goal_backing") return t("home.exceptionOpenGoal");
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
  const currency = pulse?.currency ?? "VND";
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
  if (allocationHealth.status === "no_income") {
    allExceptions.push({ kind: "no_income" });
  } else if (allocationHealth.status === "over_allocated") {
    allExceptions.push({
      kind: "over_allocated",
      percent: allocationHealth.utilizationPercent,
    });
  }
  for (const goal of goalsMissingBacking) {
    allExceptions.push({
      kind: "goal_backing",
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
    (budget) => budget.state === "overspent",
  ).length;
  const healthTitle =
    health === PlanHomeHealthStatus.HEALTHY
      ? t("home.healthHealthy")
      : health === PlanHomeHealthStatus.ATTENTION
        ? t("home.healthAttention")
        : health === PlanHomeHealthStatus.OFF_TRACK
          ? t("home.healthOffTrack")
          : t("home.healthNoPlan");
  const healthBody =
    health === PlanHomeHealthStatus.HEALTHY
      ? t("home.healthHealthyBody")
      : health === PlanHomeHealthStatus.ATTENTION
        ? t("home.healthAttentionBody", {
            issue: exceptions[0]
              ? exceptionTitle(
                  exceptions[0],
                  t as unknown as LooseTranslator,
                  tCatalog as unknown as LooseTranslator,
                )
              : t("home.attentionFallback"),
          })
        : health === PlanHomeHealthStatus.OFF_TRACK
          ? t("home.healthOffTrackBody", { count: overspentCount })
          : t("home.healthNoPlanBody");

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
        <Card
          tone="hero"
          className="relative overflow-hidden gap-(--space-5) p-(--space-5)"
          data-testid="plan-period-pulse"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-end justify-between gap-(--space-3)">
            <div>
              <Text
                size="xs"
                className="text-hero-muted uppercase tracking-[0.14em]"
              >
                {t("period.label")}
              </Text>
              <Text className="mt-1 text-2xl font-semibold tracking-tight text-hero-fg">
                {periodLabel}
              </Text>
            </div>
            <StatusBadge
              tone="selected"
              className="bg-white/10 text-hero-fg ring-white/15"
            >
              {t(
                assistMode === PlanAssistMode.MANUAL
                  ? "home.assistManual"
                  : "home.assistAssisted",
              )}
            </StatusBadge>
          </div>
          <div className="relative flex items-start gap-(--space-3) border-t border-white/15 pt-(--space-4)">
            <span
              className={`mt-1 size-2.5 shrink-0 rounded-full ${health === PlanHomeHealthStatus.OFF_TRACK ? "bg-danger" : health === PlanHomeHealthStatus.ATTENTION ? "bg-warning" : health === PlanHomeHealthStatus.NO_PLAN ? "bg-white/40" : "bg-success"}`}
              aria-hidden
            />
            <div className="min-w-0">
              <Text className="font-semibold text-hero-fg">{healthTitle}</Text>
              <Text size="sm" className="text-hero-muted">
                {healthBody}
              </Text>
            </div>
          </div>
        </Card>
      </MotionReveal>

      {exceptions.length > 0 ? (
        <MotionReveal>
          <Section
            title={t("home.exceptionsTitle")}
            testId="plan-home-exceptions"
          >
            <ul className="flex flex-col gap-(--space-2)">
              {exceptions.map((exception, index) => {
                const href = exception.jarId
                  ? planJarPath(exception.jarId)
                  : exception.goalId
                    ? planGoalPath(exception.goalId)
                    : exception.kind === "uncategorized"
                      ? APP_PATH.INBOX
                      : APP_PATH.PLAN_JARS;
                return (
                  <li
                    key={`${exception.kind}-${exception.jarId ?? exception.goalId ?? index}`}
                  >
                    <div className="flex items-start justify-between gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-3)">
                      <div className="min-w-0">
                        <Text
                          size="sm"
                          className="font-medium text-text-primary"
                        >
                          {exceptionTitle(
                            exception,
                            t as unknown as LooseTranslator,
                            tCatalog as unknown as LooseTranslator,
                          )}
                        </Text>
                        {exceptionDescription(
                          exception,
                          t as unknown as LooseTranslator,
                          currency,
                          locale,
                        ) ? (
                          <Text size="sm" tone="secondary">
                            {exceptionDescription(
                              exception,
                              t as unknown as LooseTranslator,
                              currency,
                              locale,
                            )}
                          </Text>
                        ) : null}
                      </div>
                      <Link
                        href={href}
                        className="shrink-0 text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        {exceptionAction(
                          exception,
                          t as unknown as LooseTranslator,
                        )}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
            {allExceptions.length > exceptions.length ? (
              <Link
                href={APP_PATH.PLAN_JARS}
                className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t("home.viewAll")}
              </Link>
            ) : null}
          </Section>
        </MotionReveal>
      ) : null}

      <RecommendationList
        recommendations={recommendations}
        t={t as unknown as LooseTranslator}
        resolveHref={recommendationHref}
        jarNames={jarNames}
        goalNames={goalNames}
        currency={currency}
        locale={locale}
        testId="plan-home-recommendations"
      />
      <MotionReveal>
        <Section
          title={t("jars.title")}
          action={
            <Link
              href={APP_PATH.PLAN_JARS}
              className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid="plan-see-jars"
            >
              {t("home.viewAll")}
            </Link>
          }
        >
          <Text size="sm" tone="secondary">
            {t("jars.subtitle")}
          </Text>
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
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {t("home.createJar")}
                </Link>
              }
              className="flex-none py-(--space-4)"
            />
          ) : (
            <ul className="flex flex-col gap-(--space-2)">
              {activeJars.slice(0, 6).map((jar) => {
                const metrics = budgetsByJar[jar.id];
                const isNoIncome =
                  metrics?.state === "no_budget" &&
                  metrics.incomeSource === "none";
                const remainingLabel = metrics ? (
                  metrics.state === "overspent" ? (
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
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {activeJars.length > 6 ? (
            <Link
              href={APP_PATH.PLAN_JARS}
              className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {t("home.viewAllJars", { count: activeJars.length })}
            </Link>
          ) : null}
        </Section>
      </MotionReveal>

      <MotionReveal>
        <Section
          title={t("home.goalsTitle")}
          action={
            <Link
              href={APP_PATH.PLAN_GOALS}
              className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
              action={
                <Link
                  href={APP_PATH.PLAN_GOALS}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-default px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
      </MotionReveal>

      <MotionReveal>
        <Section
          title={t("home.upcomingTitle")}
          action={
            <Link
              href={APP_PATH.PLAN_CALENDAR}
              className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
            <ul className="flex flex-col gap-(--space-2)">
              {upcoming.map((event) => (
                <li key={event.id ?? `${event.date}-${event.title}`}>
                  <Card
                    tone="interactive"
                    className="gap-(--space-2) p-(--space-3)"
                  >
                    <Text size="xs" tone="secondary">
                      {formatDate(new Date(`${event.date}T00:00:00Z`), locale, {
                        day: "numeric",
                        month: "short",
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </Text>
                    <Text
                      size="sm"
                      className="line-clamp-2 break-words font-medium leading-snug text-text-primary"
                    >
                      {event.title}
                    </Text>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-(--space-3)">
                      <Text size="sm" className="tabular-nums">
                        <FinancialValue>
                          {formatCurrency(event.amount, currency, locale, {
                            maximumFractionDigits: 0,
                          })}
                        </FinancialValue>
                      </Text>
                      <Text size="xs" tone="secondary">
                        {event.source === "card_due" ||
                        event.source === "liability"
                          ? t("home.upcomingDue")
                          : t("home.upcomingExpected")}
                      </Text>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </MotionReveal>

      <MotionReveal>
        <Section variant="surface" testId="plan-ritual-cta">
          <div className="flex flex-col gap-(--space-1)">
            <Text size="sm" className="font-semibold text-text-primary">
              {t("review.title")}
            </Text>
            <Text size="sm" tone="secondary">
              {t("review.body")}
            </Text>
          </div>
          <Link
            href={APP_PATH.PLAN_RITUAL}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-(--space-4) text-sm font-medium text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:w-auto sm:self-start"
            data-testid="plan-ritual-open"
          >
            {t("review.cta")}
          </Link>
        </Section>
      </MotionReveal>

      <div
        data-testid="plan-teaching"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-(--space-3)"
      >
        <Text size="sm" tone="secondary">
          {t("teaching.body")}
        </Text>
        <Link
          href={APP_PATH.MONEY}
          className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="plan-money-link"
        >
          {t("moneyLink")}
        </Link>
        <Link
          href={APP_PATH.PLAN_GOALS}
          className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="plan-entry-goals"
        >
          {t("home.goalsSeeAll")}
        </Link>
        <Link
          href={APP_PATH.PLAN_RECURRING}
          className="text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="plan-entry-recurring"
        >
          {t("home.recurringLink")}
        </Link>
      </div>
    </Page>
  );
}
