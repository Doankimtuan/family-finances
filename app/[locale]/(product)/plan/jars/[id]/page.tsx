import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
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
import { formatCurrency } from "@/shared/i18n/formatters";
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
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { EmergencyInboxBanner } from "../../emergency-inbox-banner";
import { PlanPrivacyToggle } from "../../plan-privacy-toggle";
import { PlanSectionTitle } from "../../plan-section-title";
import { PlanUnavailable } from "../../plan-unavailable";
import { PLAN_SURFACE_LINK_CLASS } from "../../plan-chrome";
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

function JarIntentionHero({
  plannedHeading,
  plannedBody,
  kindLabel,
  stateLabel,
  state,
  remainingLabel,
}: {
  plannedHeading: string;
  plannedBody: ReactNode;
  kindLabel: string;
  stateLabel: string;
  state: JarStateValue;
  remainingLabel: ReactNode;
}) {
  return (
    <Card
      tone="hero"
      className="gap-0 p-(--space-4)"
      data-testid="plan-jar-hero"
    >
      <div className="flex items-center gap-(--space-3)">
        <div className="flex min-w-0 flex-1 items-center gap-(--space-3)">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) border border-white/25 bg-white/10 text-hero-fg">
            <AppIcon icon={PLAN_ICONS.jar} size={AppIconSize.MD} emphasized />
          </span>
          <Text
            size="sm"
            weight="medium"
            className="text-pretty text-hero-muted"
          >
            {plannedHeading}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-(--space-2)">
          <StatusBadge
            tone={stateBadgeTone(state)}
            data-testid="jar-state-badge"
            className="bg-white/10 text-hero-fg ring-white/15"
          >
            {stateLabel}
          </StatusBadge>
          <PlanPrivacyToggle testId="plan-jar-privacy-toggle" />
        </div>
      </div>
      <div className="mt-(--space-3)">{plannedBody}</div>
      <div className="mt-(--space-4) flex flex-col gap-(--space-2) border-t border-white/15 pt-(--space-3)">
        <Text size="sm" className="text-hero-muted">
          {kindLabel}
        </Text>
        <Text
          size="sm"
          className="text-hero-muted"
          data-financial-kind={FinancialNumberKind.INTENTION}
          data-financial-object="jar"
        >
          {remainingLabel}
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
  const usagePercent = jarBudgetProgressPercent(budgetMetrics);
  const overspent = isJarBudgetOverspent(budgetMetrics);

  let plannedBody: ReactNode = (
    <Text size="lg" weight="semibold" className="text-hero-fg">
      {t("planNone")}
    </Text>
  );
  if (jar.plan?.kind === JarPlanKind.PERCENT) {
    plannedBody = (
      <Text size="lg" weight="semibold" className="text-hero-fg">
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
        amountClassName="text-hero-fg"
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
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={displayName}
          subtitle={t("detailSubtitle")}
          backHref={APP_PATH.PLAN_JARS}
          backLabel={t("backToList")}
        />
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
        plannedHeading={t("plannedHeading")}
        plannedBody={plannedBody}
        kindLabel={t(`kinds.${jar.kind}`)}
        stateLabel={t(jarStateLabelKey(jar.state))}
        state={jar.state}
        remainingLabel={remainingLabel}
      />

      {budgetMetrics && usagePercent != null ? (
        <Card
          tone="elevated"
          className="gap-(--space-4) p-(--space-4)"
          data-testid="jar-budget-metrics"
        >
          <div className="grid grid-cols-3 gap-(--space-3)">
            <Amount
              label={t("budgetLabel")}
              amountLabel={formatMoney(
                budgetMetrics.budgetAmount,
                jar.currency,
                locale,
              )}
              kind={FinancialNumberKind.INTENTION}
            />
            <Amount
              label={t("spentLabel")}
              amountLabel={formatMoney(
                budgetMetrics.spentAmount,
                jar.currency,
                locale,
              )}
              kind={FinancialNumberKind.INTENTION}
            />
            <Amount
              label={overspent ? t("overByHeading") : t("remainingLabel")}
              amountLabel={formatMoney(
                Math.abs(budgetMetrics.remainingAmount),
                jar.currency,
                locale,
              )}
              kind={FinancialNumberKind.INTENTION}
            />
          </div>
          <Progress
            value={usagePercent}
            max={100}
            label={t("budget.used", { percent: usagePercent })}
            privacyAware
            indicatorClassName={
              budgetMetrics.state === JarBudgetState.OVERSPENT
                ? "bg-danger"
                : undefined
            }
          />
        </Card>
      ) : null}

      <Section
        variant="surface"
        title={<PlanSectionTitle>{t("allocationHeading")}</PlanSectionTitle>}
      >
        <Text size="sm" tone="secondary" className="text-pretty">
          {t("incomeModeLabel", {
            mode: t(`incomeModes.${jar.incomeAllocateMode}`),
          })}
        </Text>
        <Text size="sm" tone="secondary" className="text-pretty">
          {t("incomeModeHint")}
        </Text>
        <Text size="sm" tone="secondary" className="text-pretty">
          {t("allocationMeaning")}
        </Text>
      </Section>

      <div
        className="flex flex-col gap-(--space-2)"
        data-testid="jar-monthly-review-info"
      >
        <StatusAlert
          variant={AlertVariant.INFO}
          title={tReview("reviewWithoutBlocking")}
          description={tReview("reviewedBody")}
        />
        <Link href={APP_PATH.PLAN_RITUAL} className={PLAN_SURFACE_LINK_CLASS}>
          {tReview("open")}
        </Link>
      </div>

      {jar.state === JarState.ACTIVE ? (
        <ReallocateJarForm
          sourceJarId={jar.id}
          sourceJarName={displayName}
          availableToMove={Math.max(0, budgetMetrics?.remainingAmount ?? 0)}
          currency={jar.currency}
          targetJars={targetJars}
          overspendPolicy={policies?.overspendPolicy ?? OverspendPolicy.WARN}
        />
      ) : null}

      <JarDetailControls
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
      />
    </Page>
  );
}
