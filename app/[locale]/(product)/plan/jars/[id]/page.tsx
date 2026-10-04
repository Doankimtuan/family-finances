import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getHouseholdPolicies } from "@/modules/tenancy/application/get-household-policies";
import { OverspendPolicy } from "@/modules/tenancy/application/household-policies.schema";
import { listOpenInboxItems } from "@/modules/inbox/application";
import {
  getJar,
  listActiveJars,
  getCurrentJarBudgets,
  JarState,
  JarPlanKind,
  JarBudgetState,
  type JarBudgetMetrics,
  type JarState as JarStateValue,
  listJarCategories,
} from "@/modules/plan/application";
import {
  JarRolloverMode,
  JAR_BUDGET_PERCENT_SCALE,
} from "@/modules/plan/application/plan-constants";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { basisPointsToPercentage } from "@/shared/utils/percentage";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Amount, AmountSize } from "@/shared/patterns/amount";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { Card } from "@/shared/patterns/card";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
import { Alert, AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import {
  PLAN_ICONS,
  ACTION_ICONS,
  UTILITY_ICONS,
  categoryVisualFor,
} from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { EmergencyInboxBanner } from "../../emergency-inbox-banner";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { PlanDisclosure } from "../../plan-disclosure";
import { PlanPrivacyToggle } from "../../plan-privacy-toggle";
import { PlanSectionTitle } from "../../plan-section-title";
import { PlanUnavailable } from "../../plan-unavailable";
import { JarRecentActivity } from "../jar-recent-activity";
import { Heading } from "@/shared/ui/heading";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { CreateCategoryForm } from "../create-category-form";
import { getPlanMonthProgress } from "../../plan-hub-presentations";
import { currentPeriodMonth } from "@/modules/plan/application/ritual-period";
import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";
import { Skeleton } from "@/shared/ui/skeleton";
import { JarDetailControls } from "./jar-detail-controls";
import { ReallocateJarForm } from "../reallocate-jar-form";
import {
  jarBudgetProgressPercent,
  jarIntentionRemainingLabel,
  jarStateLabelKey,
  isJarBudgetOverspent,
} from "../jar-presentations";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

type JarPlanTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  rich: (
    key: string,
    values?: Record<string, string | ((chunks: ReactNode) => ReactNode)>,
  ) => ReactNode;
};

function stateBadgeTone(state: JarStateValue) {
  return state === JarState.ACTIVE
    ? StatusBadgeTone.POSITIVE
    : StatusBadgeTone.NEUTRAL;
}

function formatMoney(amount: number, currency: string, locale: string): string {
  return formatCurrency(amount, currency, locale, {
    maximumFractionDigits: 0,
  });
}

function JarIntentionNotice({ label }: { label: string }) {
  return (
    <Alert
      variant={AlertVariant.INFO}
      className="gap-(--space-2) border border-primary/20 bg-primary/5 p-(--space-3) text-primary"
      data-testid="jar-intention-invariant"
    >
      <AppIcon
        icon={UTILITY_ICONS.shield}
        size={AppIconSize.SM}
        className="shrink-0"
      />
      <Text size="xs" className="text-pretty leading-relaxed text-primary">
        {label}
      </Text>
    </Alert>
  );
}

function JarIntentionHero({
  periodLabel,
  plannedHeading,
  plannedBody,
  kindLabel,
  rolloverLabel,
  stateLabel,
  state,
  remainingLabel,
  icon,
}: {
  periodLabel: string;
  plannedHeading: string;
  plannedBody: ReactNode;
  kindLabel: string;
  rolloverLabel: string;
  stateLabel: string;
  state: JarStateValue;
  remainingLabel: ReactNode;
  icon: typeof PLAN_ICONS.jar;
}) {
  return (
    <Card
      tone="elevated"
      className="gap-(--space-3) p-(--space-4)"
      data-testid="plan-jar-hero"
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <IconContainer tone={IconContainerTone.PRIMARY} size="md">
            <AppIcon icon={icon} size={AppIconSize.MD} />
          </IconContainer>
          <div className="min-w-0">
            <Text size="sm" weight="semibold">
              {periodLabel}
            </Text>
            <Text size="xs" tone="secondary" className="text-pretty">
              {kindLabel} · {rolloverLabel}
            </Text>
          </div>
        </div>
        <StatusBadge
          tone={stateBadgeTone(state)}
          data-testid="jar-state-badge"
          className="shrink-0"
        >
          {stateLabel}
        </StatusBadge>
      </div>
      <div>
        <Text
          size="xs"
          tone="secondary"
          className="mb-(--space-1) font-medium tracking-wide uppercase"
        >
          {plannedHeading}
        </Text>
        {plannedBody}
        <Text
          size="xs"
          tone="secondary"
          className="mt-(--space-2) text-pretty"
          data-financial-kind={FinancialNumberKind.INTENTION}
        >
          {kindLabel} · {rolloverLabel} · {remainingLabel}
        </Text>
      </div>
    </Card>
  );
}

/**
 * plan.jar-detail — Planned amount (not Balance), state, allocation (ST-E05-002 / F3).
 */
export default async function PlanJarDetailPage({ params }: Props) {
  const { locale: rawLocale, id } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    return redirect({ href: APP_PATH.LOGIN, locale });
  }
  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [
    t,
    tReview,
    tCatalog,
    jar,
    activeJars,
    policies,
    inboxItems,
    categories,
    budgets,
  ] = await Promise.all([
    getTranslations("plan.jars"),
    getTranslations("plan.monthlyReview"),
    getTranslations("catalog"),
    getJar(id),
    listActiveJars(),
    getHouseholdPolicies(),
    listOpenInboxItems(),
    listJarCategories(),
    getCurrentJarBudgets(),
  ]);

  if (!jar) {
    return (
      <Page
        testId="plan-jar-detail"
        topBar={
          <TopAppBar
            variant={TopAppBarVariant.DETAIL}
            title={t("notFound")}
            backHref={APP_PATH.PLAN_JARS}
            backLabel={t("backToList")}
          />
        }
      >
        <PlanUnavailable
          title={t("notFound")}
          description={t("detailSubtitle")}
          actionHref={APP_PATH.PLAN_JARS}
          actionLabel={t("backToList")}
        />
      </Page>
    );
  }

  const linkedCategories =
    categories?.filter((category) => category.jarId === jar.id) ?? [];
  const translator = t as unknown as JarPlanTranslator;
  const displayName = jar.isNameCustom
    ? jar.name
    : localizeCatalogName(tCatalog, CatalogGroup.JARS, jar.name);
  const budgetMetrics: JarBudgetMetrics | undefined = budgets?.byJarId[jar.id];
  const remainingLabel =
    jarIntentionRemainingLabel(
      budgetMetrics,
      translator,
      jar.currency,
      locale,
    ) ?? t("budget.notAvailable");
  const periodMonth = budgets?.periodMonth ?? currentPeriodMonth();
  const periodLabel = t("detailPeriod", {
    period: formatDate(new Date(periodMonth), locale, {
      month: "numeric",
      year: "numeric",
      timeZone: HOUSEHOLD_TIMEZONE.VIETNAM,
    }),
  });
  const monthProgress = getPlanMonthProgress(periodMonth, locale);
  const rolloverLabel = t(
    jar.rolloverMode === JarRolloverMode.CARRY
      ? "rolloverCarry"
      : "rolloverReset",
  );
  const heroIcon = linkedCategories.length
    ? categoryVisualFor({
        categoryId: linkedCategories[0].id,
        categoryName: linkedCategories[0].name,
      }).icon
    : PLAN_ICONS.jar;
  const usagePercent = jarBudgetProgressPercent(budgetMetrics);
  const overspent = isJarBudgetOverspent(budgetMetrics);

  let plannedBody: ReactNode = (
    <Text size="lg" weight="semibold" className="text-text-primary">
      {t("planNone")}
    </Text>
  );
  if (budgetMetrics) {
    plannedBody = (
      <Amount
        amountLabel={formatMoney(
          budgetMetrics.budgetAmount,
          jar.currency,
          locale,
        )}
        size={AmountSize.LG}
        kind={FinancialNumberKind.INTENTION}
      />
    );
  } else if (jar.plan?.kind === JarPlanKind.PERCENT) {
    plannedBody = (
      <Text size="lg" weight="semibold" className="text-text-primary">
        {t("planPercent", {
          percent: Math.round(basisPointsToPercentage(jar.plan.percentBps)),
        })}
      </Text>
    );
  } else if (jar.plan?.kind === JarPlanKind.FIXED) {
    plannedBody = (
      <Amount
        label={t("plannedHeading")}
        amountLabel={formatMoney(jar.plan.fixedAmount, jar.currency, locale)}
        size={AmountSize.LG}
        kind={FinancialNumberKind.INTENTION}
        labelClassName="sr-only"
        amountClassName="text-text-primary"
      />
    );
  }

  const targetJars = (activeJars ?? [])
    .filter((candidate) => candidate.id !== jar.id)
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
    }));

  return (
    <Page
      testId="plan-jar-detail"
      contentClassName="gap-(--space-3) pt-(--space-2)"
      topBar={
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-(--space-2) px-(--page-gutter) py-(--space-3)">
          <Link
            href={APP_PATH.PLAN}
            className="inline-flex min-h-11 items-center gap-(--space-1) text-xs font-medium text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <AppIcon icon={ACTION_ICONS.back} size={AppIconSize.SM} />
            {t("backToPlan")}
          </Link>
          <div className="min-w-0 text-center">
            <Heading level={1} className="text-sm leading-snug text-pretty">
              {displayName}
            </Heading>
            <Text size="xs" tone="secondary">
              {t("detailQuotaSubtitle")}
            </Text>
          </div>
          <PlanPrivacyToggle
            testId="plan-jar-privacy-toggle"
            onSurface
            className="rounded-full"
          />
        </header>
      }
    >
      <PlanOfflineBanner />

      <EmergencyInboxBanner
        items={inboxItems ?? []}
        viewerUserId={user.id}
        title={t("reallocate.emergencyBannerTitle")}
        body={t("reallocate.emergencyBannerBody")}
        openLabel={t("reallocate.emergencyBannerOpen")}
      />

      <JarIntentionHero
        periodLabel={periodLabel}
        icon={heroIcon}
        rolloverLabel={rolloverLabel}
        plannedHeading={t("detailQuotaHeading")}
        plannedBody={plannedBody}
        kindLabel={t(`kindDescriptions.${jar.kind}`)}
        stateLabel={t(jarStateLabelKey(jar.state))}
        state={jar.state}
        remainingLabel={remainingLabel}
      />

      {budgetMetrics && usagePercent != null ? (
        <Card
          tone="elevated"
          className="gap-(--space-3) p-(--space-4)"
          data-testid="jar-budget-metrics"
        >
          <div className="grid grid-cols-3 gap-(--space-2)">
            <Amount
              label={t("budgetLabel")}
              amountLabel={formatMoney(
                budgetMetrics.budgetAmount,
                jar.currency,
                locale,
              )}
              kind={FinancialNumberKind.INTENTION}
              className="min-w-0"
              labelClassName="text-xs"
              amountClassName="text-sm break-words"
            />
            <Amount
              label={t("spentLabel")}
              amountLabel={formatMoney(
                budgetMetrics.spentAmount,
                jar.currency,
                locale,
              )}
              kind={FinancialNumberKind.INTENTION}
              className="min-w-0 items-center text-center"
              labelClassName="text-xs"
              amountClassName="text-sm break-words"
            />
            <Amount
              label={overspent ? t("overByHeading") : t("remainingLabel")}
              amountLabel={formatMoney(
                Math.abs(budgetMetrics.remainingAmount),
                jar.currency,
                locale,
              )}
              kind={FinancialNumberKind.INTENTION}
              className="min-w-0 items-end text-right"
              labelClassName="text-xs"
              amountClassName={
                overspent
                  ? "text-sm break-words text-danger"
                  : "text-sm break-words text-primary"
              }
            />
          </div>
          <Progress
            value={usagePercent}
            max={JAR_BUDGET_PERCENT_SCALE}
            label={t("budget.used", { percent: usagePercent })}
            privacyAware
            showLabel={false}
            trackClassName="h-(--space-2)"
            indicatorClassName={
              budgetMetrics.state === JarBudgetState.OVERSPENT
                ? "bg-danger"
                : undefined
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-(--space-2)">
            <Text size="xs" tone="secondary">
              <FinancialValue>
                {t("budget.used", { percent: usagePercent })}
              </FinancialValue>
            </Text>
            {monthProgress ? (
              <Text size="xs" className="text-primary">
                <FinancialValue>
                  {t("detailRemainingPeriod", {
                    percent: Math.max(
                      0,
                      JAR_BUDGET_PERCENT_SCALE - usagePercent,
                    ),
                    days: monthProgress.days - monthProgress.day,
                  })}
                </FinancialValue>
              </Text>
            ) : null}
          </div>
          <JarIntentionNotice label={t("detailInvariant")} />
        </Card>
      ) : (
        <JarIntentionNotice label={t("detailInvariant")} />
      )}

      <JarDetailControls
        primaryAction={
          jar.state === JarState.ACTIVE ? (
            <ReallocateJarForm
              sourceJarId={jar.id}
              sourceJarName={displayName}
              availableToMove={Math.max(0, budgetMetrics?.remainingAmount ?? 0)}
              currency={jar.currency}
              targetJars={targetJars}
              overspendPolicy={
                policies?.overspendPolicy ?? OverspendPolicy.WARN
              }
              triggerLabel={t("detailAdjust")}
            />
          ) : undefined
        }
        jarId={jar.id}
        state={jar.state}
        kind={jar.kind}
        plan={jar.plan}
        rolloverMode={jar.rolloverMode}
        name={jar.name}
        categories={categories ?? []}
        availableJars={(activeJars ?? [])
          .filter((candidate) => candidate.id !== jar.id)
          .map((candidate) => ({ id: candidate.id, name: candidate.name }))}
        currency={jar.currency}
        qualifyingIncome={budgets?.qualifyingIncome ?? null}
      >
        <Card
          tone="elevated"
          className="gap-(--space-3) p-(--space-4)"
          data-testid="jar-linked-categories"
        >
          <div className="flex flex-wrap items-center justify-between gap-(--space-2)">
            <Heading
              level={2}
              className="text-xs font-medium tracking-wide uppercase"
            >
              {t("detailCategories", { count: linkedCategories.length })}
            </Heading>
            <CreateCategoryForm
              jars={(activeJars ?? []).map(({ id, name, kind }) => ({
                id,
                name,
                kind,
              }))}
              defaultJarId={jar.id}
              compact
            />
          </div>
          <div className="flex flex-wrap gap-(--space-2)">
            {linkedCategories.map((category) => (
              <StatusBadge
                key={category.id}
                tone={StatusBadgeTone.NEUTRAL}
                className="h-auto min-h-(--space-7) gap-(--space-1) rounded-(--radius-sm) px-(--space-2) py-(--space-1) font-medium"
              >
                <AppIcon
                  icon={
                    categoryVisualFor({
                      categoryId: category.id,
                      categoryName: category.name,
                    }).icon
                  }
                  size={AppIconSize.XS}
                />
                {localizeCatalogName(
                  tCatalog,
                  CatalogGroup.TAGS,
                  category.name,
                )}
              </StatusBadge>
            ))}
            {linkedCategories.length === 0 ? (
              <Text size="sm" tone="secondary">
                {t(
                  categories
                    ? "linkedCategoriesEmpty"
                    : "linkedCategoriesUnavailable",
                )}
              </Text>
            ) : null}
          </div>
          {linkedCategories.length > 0 ? (
            <Text size="xs" tone="secondary" className="text-pretty">
              {t("detailCategoriesHint", { name: displayName })}
            </Text>
          ) : null}
        </Card>
        <Suspense fallback={<Skeleton className="h-(--space-16) w-full" />}>
          <JarRecentActivity jarId={jar.id} locale={locale} />
        </Suspense>

        <div
          className="flex items-center justify-between gap-(--space-2) rounded-(--radius-control) border border-primary/15 bg-primary/5 px-(--space-3) py-(--space-2)"
          data-testid="jar-monthly-review-info"
        >
          <Text
            size="xs"
            tone="secondary"
            className="flex min-w-0 flex-1 items-center gap-(--space-2)"
          >
            <AppIcon
              icon={UTILITY_ICONS.info}
              size={AppIconSize.XS}
              className="shrink-0"
            />
            <span className="truncate">{tReview("reviewWithoutBlocking")}</span>
          </Text>
          <Link
            href={APP_PATH.PLAN_RITUAL}
            className="inline-flex min-h-11 shrink-0 items-center gap-(--space-1) text-xs font-medium text-primary"
          >
            {t("detailReviewReport")}
            <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.XS} />
          </Link>
        </div>
        <PlanDisclosure
          showLabel={t("allocationHeading")}
          hideLabel={t("allocationHeading")}
          testId="jar-allocation-rules"
        >
          <Section
            variant="surface"
            title={
              <PlanSectionTitle>{t("allocationHeading")}</PlanSectionTitle>
            }
          >
            <Text size="sm" tone="secondary">
              {t("incomeModeLabel", {
                mode: t(`incomeModes.${jar.incomeAllocateMode}`),
              })}
            </Text>
            <Text size="sm" tone="secondary">
              {t("incomeModeHint")}
            </Text>
            <Text size="sm" tone="secondary">
              {t("allocationMeaning")}
            </Text>
          </Section>
        </PlanDisclosure>
      </JarDetailControls>
    </Page>
  );
}
