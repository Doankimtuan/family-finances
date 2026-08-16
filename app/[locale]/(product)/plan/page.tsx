import { getTranslations } from "next-intl/server";
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
import { HeaderPill, TopAppBar } from "@/shared/patterns/top-app-bar";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
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
type LooseTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type HomeGoal = {
  id: string;
  name: string;
  status: string;
  targetDate: string | null;
  targetAmount: number;
  fundedAmount: number;
  progressPercent: number;
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
      return a.progressPercent - b.progressPercent;
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
  t: (key: string, values?: Record<string, string | number>) => string,
  currency: string,
  locale: string,
) {
  if (exception.kind === "overspent_jar") {
    return t("home.exceptionOverspentBody", {
      amount: formatCurrency(exception.amount ?? 0, currency, locale, {
        maximumFractionDigits: 0,
      }),
    });
  }
  if (exception.kind === "near_limit_jar") {
    return t("home.exceptionNearLimitBody", {
      amount: formatCurrency(exception.amount ?? 0, currency, locale, {
        maximumFractionDigits: 0,
      }),
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
      topBar={
        <TopAppBar
          variant="contextual"
          eyebrow={t("header.eyebrow")}
          title={t("header.headline")}
          subtitle={t("header.supporting")}
          icon={NAVIGATION_ICONS.plan}
          status={
            <HeaderPill tone="info">
              {t(
                assistMode === PlanAssistMode.MANUAL
                  ? "home.assistManual"
                  : "home.assistAssisted",
              )}
            </HeaderPill>
          }
          meta={t("period.summary", {
            active: activeJars.length,
            paused: pulse?.pausedJarCount ?? 0,
          })}
        />
      }
    >
      <PlanOfflineBanner />
      <EmergencyInboxBanner
        items={inboxItems ?? []}
        viewerUserId={user.id}
        title={t("jars.reallocate.emergencyBannerTitle")}
        body={t("jars.reallocate.emergencyBannerBody")}
        openLabel={t("jars.reallocate.emergencyBannerOpen")}
      />

      <Section variant="emphasized" testId="plan-period-pulse">
        <div className="flex flex-wrap items-end justify-between gap-(--space-3)">
          <div>
            <Text
              size="xs"
              tone="secondary"
              className="uppercase tracking-[0.14em]"
            >
              {t("period.label")}
            </Text>
            <Text className="mt-1 text-xl font-semibold tracking-tight text-text-primary">
              {periodLabel}
            </Text>
          </div>
          <Text size="sm" tone="secondary">
            {t("home.modeHint", {
              mode: t(
                assistMode === PlanAssistMode.MANUAL
                  ? "home.assistManual"
                  : "home.assistAssisted",
              ),
            })}
          </Text>
        </div>
        <div className="flex items-start gap-(--space-3) rounded-[var(--radius-card)] bg-surface/70 p-(--space-3)">
          <span
            className={`mt-1 size-2.5 shrink-0 rounded-full ${health === PlanHomeHealthStatus.OFF_TRACK ? "bg-danger" : health === PlanHomeHealthStatus.ATTENTION ? "bg-warning" : health === PlanHomeHealthStatus.NO_PLAN ? "bg-border-default" : "bg-success"}`}
            aria-hidden
          />
          <div className="min-w-0">
            <Text className="font-semibold text-text-primary">
              {healthTitle}
            </Text>
            <Text size="sm" tone="secondary">
              {healthBody}
            </Text>
          </div>
        </div>
      </Section>

      {exceptions.length > 0 ? (
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
                      <Text size="sm" className="font-medium text-text-primary">
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
          <ul className="grid gap-(--space-3) md:grid-cols-2">
            {activeJars.slice(0, 6).map((jar) => {
              const metrics = budgetsByJar[jar.id];
              const isNoIncome =
                metrics?.state === "no_budget" &&
                metrics.incomeSource === "none";
              const remainingLabel = metrics
                ? metrics.state === "overspent"
                  ? t("jars.budget.overBy", {
                      amount: formatCurrency(
                        Math.abs(metrics.remainingAmount),
                        currency,
                        locale,
                        { maximumFractionDigits: 0 },
                      ),
                    })
                  : isNoIncome
                    ? t("jars.budget.setIncome")
                    : t("jars.budget.remaining", {
                        amount: formatCurrency(
                          metrics.remainingAmount,
                          currency,
                          locale,
                          { maximumFractionDigits: 0 },
                        ),
                      })
                : undefined;
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
                        metrics
                          ? formatCurrency(
                              metrics.budgetAmount,
                              currency,
                              locale,
                              {
                                maximumFractionDigits: 0,
                              },
                            )
                          : t("jars.budget.notAvailable")
                      }
                      spentLabel={
                        metrics
                          ? formatCurrency(
                              metrics.spentAmount,
                              currency,
                              locale,
                              {
                                maximumFractionDigits: 0,
                              },
                            )
                          : t("jars.budget.notAvailable")
                      }
                      remainingLabel={remainingLabel}
                      usageLabel={
                        metrics
                          ? t("jars.budget.used", {
                              percent: metrics.usagePercent,
                            })
                          : t("jars.budget.notAvailable")
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
          <ul className="grid gap-(--space-3) md:grid-cols-3">
            {homeGoals.map((goal) => {
              const targetDate = formatGoalDate(goal.targetDate, locale);
              return (
                <li key={goal.id}>
                  <Link
                    href={planGoalPath(goal.id)}
                    className="flex h-full flex-col gap-(--space-2) rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-3) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    data-testid={`plan-home-goal-${goal.id}`}
                  >
                    <Text size="sm" className="font-semibold text-text-primary">
                      {goal.name}
                    </Text>
                    <Text size="sm" tone="secondary" className="tabular-nums">
                      {t("home.goalProgress", {
                        funded: formatCurrency(
                          goal.fundedAmount,
                          currency,
                          locale,
                          {
                            maximumFractionDigits: 0,
                          },
                        ),
                        target: formatCurrency(
                          goal.targetAmount,
                          currency,
                          locale,
                          {
                            maximumFractionDigits: 0,
                          },
                        ),
                        percent: goal.progressPercent,
                      })}
                    </Text>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <span className="text-xs font-medium text-accent">
                        {goal.isLegacyIntention
                          ? t("home.goalLegacy")
                          : t("home.goalLinked")}
                      </span>
                      {targetDate ? (
                        <span className="text-xs text-text-secondary">
                          {targetDate}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

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
          <ul className="grid gap-(--space-2) md:grid-cols-3">
            {upcoming.map((event) => (
              <li
                key={event.id ?? `${event.date}-${event.title}`}
                className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-3)"
              >
                <Text size="xs" tone="secondary">
                  {formatDate(new Date(`${event.date}T00:00:00Z`), locale, {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Ho_Chi_Minh",
                  })}
                </Text>
                <Text size="sm" className="mt-1 font-medium text-text-primary">
                  {event.title}
                </Text>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Text size="sm" className="tabular-nums">
                    {formatCurrency(event.amount, currency, locale, {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                  <Text size="xs" tone="secondary">
                    {event.source === "card_due" || event.source === "liability"
                      ? t("home.upcomingDue")
                      : t("home.upcomingExpected")}
                  </Text>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

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
