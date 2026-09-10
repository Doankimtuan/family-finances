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
  planRecurringPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getPlanPulse,
  getCurrentJarBudgets,
  listPlanHubUpcomingEvents,
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
  PLAN_HUB_UPCOMING_DAYS,
  PLAN_HUB_UPCOMING_EVENT_LIMIT,
  type JarBudgetMetrics,
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
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { MotionReveal } from "@/shared/motion/reveal";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
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
import { PlanHubWorkObject, PlanHubWorkRow } from "./plan-hub-work-row";
import {
  allocationFactValue,
  isUpcomingDueEvent,
  PLAN_HUB_VISIBLE_GOAL_LIMIT,
  PLAN_HUB_VISIBLE_JAR_LIMIT,
  PLAN_HUB_RECOMMENDATION_LIMIT,
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

function pickHomeGoals(
  goals: readonly HomeGoal[],
  limit = PLAN_HUB_VISIBLE_GOAL_LIMIT,
): HomeGoal[] {
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
  days = PLAN_HUB_UPCOMING_DAYS,
  limit = PLAN_HUB_UPCOMING_EVENT_LIMIT,
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
      return t("home.exceptionOverspent", {
        name: name ?? t("recommendations.unknownJar"),
      });
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
      return t("home.exceptionNearLimit", {
        name: name ?? t("recommendations.unknownJar"),
      });
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

function jarRemainingLabel(
  metrics: JarBudgetMetrics | undefined,
  isNoIncome: boolean,
  isOverspent: boolean,
  t: LooseTranslator,
  currency: string,
  locale: string,
): ReactNode {
  if (!metrics) return t("jars.budget.notAvailable");
  if (isNoIncome) return t("jars.budget.setIncome");
  if (isOverspent) {
    return t.rich("jars.budget.overBy", {
      amount: formatCurrency(
        Math.abs(metrics.remainingAmount),
        currency,
        locale,
        {
          maximumFractionDigits: 0,
        },
      ),
      money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
    });
  }
  return t.rich("jars.budget.remaining", {
    amount: formatCurrency(metrics.remainingAmount, currency, locale, {
      maximumFractionDigits: 0,
    }),
    money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
  });
}

function intentionAmount(label: string) {
  return (
    <FinancialValue>
      <span data-financial-kind={FinancialNumberKind.INTENTION}>{label}</span>
    </FinancialValue>
  );
}

/** Plan hub: current intention, attention, next decision, and planning entries. */
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
    upcomingPreview,
  ] = await Promise.all([
    getTranslations("plan"),
    getTranslations("catalog"),
    getPlanPulse(),
    getCurrentJarBudgets(),
    listOpenInboxItems(),
    listGoals(),
    listPlanHubUpcomingEvents(),
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
    limit: PLAN_HUB_RECOMMENDATION_LIMIT,
  });
  const primaryRecommendation = recommendations[0];
  const supportingRecommendations = recommendations.slice(1);
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
      return planRecurringPath(action.entityId);
    return APP_PATH.PLAN;
  };
  const upcoming = upcomingWithinDays(
    (upcomingPreview?.events ?? []) as HomeEvent[],
  );
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
  const contextMeta = [
    t("home.factJarsValue", { count: activeJars.length }),
    allocationFactValue(allocationHealth, t as unknown as LooseTranslator),
  ].join(" · ");

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
          contextMeta={contextMeta}
          incomeLabel={t("home.factIncome")}
          incomeValue={
            periodIncome > 0
              ? intentionAmount(
                  formatCurrency(periodIncome, currency, locale, {
                    maximumFractionDigits: 0,
                  }),
                )
              : t("home.factIncomeEmpty")
          }
        />
      </MotionReveal>

      <PlanHubExceptions
        title={t("home.exceptionsTitle")}
        emptyTitle={t("home.exceptionsEmptyTitle")}
        emptyBody={t("home.exceptionsEmptyBody")}
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

      {primaryRecommendation ? (
        <RecommendationList
          recommendations={[primaryRecommendation]}
          t={t as unknown as LooseTranslator}
          resolveHref={recommendationHref}
          jarNames={jarNames}
          goalNames={goalNames}
          currency={currency}
          locale={locale}
          title={t("home.nextDecisionTitle")}
          variant={RecommendationListVariant.HIGHLIGHTED}
          testId="plan-home-recommendations"
        />
      ) : null}
      {supportingRecommendations.length > 0 ? (
        <RecommendationList
          recommendations={supportingRecommendations}
          t={t as unknown as LooseTranslator}
          resolveHref={recommendationHref}
          jarNames={jarNames}
          goalNames={goalNames}
          currency={currency}
          locale={locale}
          title={t("home.moreDecisionsTitle")}
          variant={RecommendationListVariant.SUPPORTING}
          testId="plan-home-recommendations-supporting"
        />
      ) : null}

      <Section
        title={<PlanSectionTitle>{t("home.upcomingTitle")}</PlanSectionTitle>}
        action={
          <Link
            href={APP_PATH.PLAN_CALENDAR}
            prefetch={PRODUCT_LINK_PREFETCH}
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
                  className="flex min-h-14 items-start gap-(--space-3) px-(--space-4) py-(--space-3)"
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

      {activeJars.length === 0 ? (
        <Section
          title={<PlanSectionTitle>{t("jars.title")}</PlanSectionTitle>}
          description={t("jars.subtitle")}
          action={
            <Link
              href={APP_PATH.PLAN_JARS}
              prefetch={PRODUCT_LINK_PREFETCH}
              className={PLAN_INLINE_LINK_CLASS}
              data-testid="plan-see-jars"
            >
              {t("home.viewAll")}
            </Link>
          }
          testId="plan-home-jars"
        >
          <EmptyState
            title={t("jars.emptyTitle")}
            description={t("jars.emptyDescription")}
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
        </Section>
      ) : (
        <PlanDestinationCard
          title={t("jars.title")}
          description={t("jars.subtitle")}
          action={
            <Link
              href={APP_PATH.PLAN_JARS}
              prefetch={PRODUCT_LINK_PREFETCH}
              className={PLAN_INLINE_LINK_CLASS}
              data-testid="plan-see-jars"
            >
              {t("home.viewAll")}
            </Link>
          }
          testId="plan-home-jars"
        >
          {!currentJarBudgets ? (
            <div className="px-(--space-4) py-(--space-3)">
              <StatusAlert
                variant="warning"
                title={t("home.jarsUnavailableTitle")}
                description={t("home.jarsUnavailableBody")}
              />
            </div>
          ) : null}
          {activeJars.slice(0, PLAN_HUB_VISIBLE_JAR_LIMIT).map((jar) => {
            const metrics = budgetsByJar[jar.id];
            const isNoIncome =
              metrics?.state === JarBudgetState.NO_BUDGET &&
              metrics.incomeSource === QualifyingIncomeSource.NONE;
            const isOverspent = metrics?.state === JarBudgetState.OVERSPENT;
            const remainingLabel = jarRemainingLabel(
              metrics,
              isNoIncome,
              Boolean(isOverspent),
              t as unknown as LooseTranslator,
              currency,
              locale,
            );
            return (
              <PlanHubWorkRow
                key={jar.id}
                href={planJarPath(jar.id)}
                testId={`plan-jar-${jar.id}`}
                icon={PLAN_ICONS.jar}
                iconTone={IconContainerTone.SAVINGS}
                label={localizeCatalogName(tCatalog, "jars", jar.name)}
                meta={t(`jars.kinds.${jar.kind}`)}
                value={remainingLabel}
                valueTone={isOverspent ? "danger" : "primary"}
                marksIntention={Boolean(metrics) && !isNoIncome}
                financialObject={PlanHubWorkObject.JAR}
              />
            );
          })}
          {activeJars.length > PLAN_HUB_VISIBLE_JAR_LIMIT ? (
            <Link
              href={APP_PATH.PLAN_JARS}
              prefetch={PRODUCT_LINK_PREFETCH}
              className={`${PLAN_INLINE_LINK_CLASS} mx-(--space-2) my-(--space-1)`}
            >
              {t("home.viewAllJars", { count: activeJars.length })}
            </Link>
          ) : null}
        </PlanDestinationCard>
      )}

      {homeGoals.length === 0 ? (
        <Section
          title={<PlanSectionTitle>{t("home.goalsTitle")}</PlanSectionTitle>}
          action={
            <span data-testid="plan-entry-goals" className="inline-flex">
              <Link
                href={APP_PATH.PLAN_GOALS}
                prefetch={PRODUCT_LINK_PREFETCH}
                className={PLAN_INLINE_LINK_CLASS}
                data-testid="plan-see-goals"
              >
                {t("home.viewAll")}
              </Link>
            </span>
          }
          testId="plan-home-goals"
        >
          <EmptyState
            title={t("home.goalsEmptyTitle")}
            description={t("home.goalsEmptyBody")}
            icon={<AppIcon icon={PLAN_ICONS.goal} size={AppIconSize.DISPLAY} />}
            action={
              <Link
                href={APP_PATH.PLAN_GOALS}
                prefetch={PRODUCT_LINK_PREFETCH}
                className={PLAN_SURFACE_LINK_CLASS}
              >
                {t("home.createGoal")}
              </Link>
            }
            className="flex-none py-(--space-4)"
          />
        </Section>
      ) : (
        <PlanDestinationCard
          title={t("home.goalsTitle")}
          action={
            <span data-testid="plan-entry-goals" className="inline-flex">
              <Link
                href={APP_PATH.PLAN_GOALS}
                prefetch={PRODUCT_LINK_PREFETCH}
                className={PLAN_INLINE_LINK_CLASS}
                data-testid="plan-see-goals"
              >
                {t("home.viewAll")}
              </Link>
            </span>
          }
          testId="plan-home-goals"
        >
          {homeGoals.map((goal) => {
            const targetDate = formatGoalDate(goal.targetDate, locale);
            return (
              <PlanHubWorkRow
                key={goal.id}
                href={planGoalPath(goal.id)}
                testId={`plan-home-goal-${goal.id}`}
                icon={PLAN_ICONS.goal}
                iconTone={IconContainerTone.INVESTMENT}
                label={goal.name}
                meta={[
                  goal.isLegacyIntention
                    ? t("home.goalLegacy")
                    : t("home.goalLinked"),
                  targetDate,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                value={
                  goal.progressPercent == null
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
                      })
                }
                valueTone={
                  goal.progressPercent == null ? "secondary" : "primary"
                }
                marksIntention={goal.progressPercent != null}
                financialObject={PlanHubWorkObject.GOAL}
              />
            );
          })}
        </PlanDestinationCard>
      )}

      <PlanDestinationCard
        title={t("home.workspaceTitle")}
        testId="plan-ritual-cta"
      >
        <PlanDestinationRow
          href={APP_PATH.PLAN_RECURRING}
          testId="plan-entry-recurring"
          icon={PLAN_ICONS.recurring}
          iconTone={IconContainerTone.TRANSFER}
          label={t("home.recurringLink")}
          meta={t("home.workspaceRecurringMeta")}
        />
        <PlanDestinationRow
          href={APP_PATH.PLAN_CALENDAR}
          testId="plan-workspace-calendar"
          icon={PLAN_ICONS.calendar}
          iconTone={IconContainerTone.INFO}
          label={t("calendar.title")}
          meta={t("home.workspaceCalendarMeta")}
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
        <Link
          href={APP_PATH.MONEY}
          prefetch={PRODUCT_LINK_PREFETCH}
          className={PLAN_INLINE_LINK_CLASS}
          data-testid="plan-money-link"
        >
          {t("moneyLink")}
        </Link>
      </div>
    </Page>
  );
}
