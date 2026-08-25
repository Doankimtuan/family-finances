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
import {
  getJar,
  listActiveJars,
  getCurrentJarBudgets,
  JarState,
  JarPlanKind,
  type JarState as JarStateValue,
  listJarCategories,
} from "@/modules/plan/application";
import { listOpenInboxItems } from "@/modules/inbox/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { basisPointsToPercentage } from "@/shared/utils/percentage";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Amount } from "@/shared/patterns/amount";
import { Card } from "@/shared/patterns/card";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Progress } from "@/shared/ui/progress";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { EmergencyInboxBanner } from "../../emergency-inbox-banner";
import { JarDetailControls } from "./jar-detail-controls";
import { ReallocateJarForm } from "../reallocate-jar-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function stateKey(state: JarStateValue) {
  if (state === JarState.PAUSED) return "statePaused" as const;
  if (state === JarState.ARCHIVED) return "stateArchived" as const;
  return "stateActive" as const;
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
        topBar={<TopAppBar title={t("notFound")} />}
      >
        <Link
          href={APP_PATH.PLAN_JARS}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("backToList")}
        </Link>
      </Page>
    );
  }

  const displayName = jar.isNameCustom
    ? jar.name
    : localizeCatalogName(tCatalog, "jars", jar.name);
  let plannedLabel = t("planNone");
  if (jar.plan?.kind === JarPlanKind.PERCENT) {
    plannedLabel = t("planPercent", {
      percent: Math.round(basisPointsToPercentage(jar.plan.percentBps)),
    });
  } else if (jar.plan?.kind === JarPlanKind.FIXED) {
    plannedLabel = formatCurrency(jar.plan.fixedAmount, jar.currency, locale, {
      maximumFractionDigits: 0,
    });
  }

  const targetJars = (activeJars ?? [])
    .filter((candidate) => candidate.id !== jar.id)
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
    }));

  const budgetMetrics = budgets?.byJarId[jar.id];
  const budgetLabel = formatCurrency(
    budgetMetrics?.budgetAmount ?? 0,
    jar.currency,
    locale,
    { maximumFractionDigits: 0 },
  );
  const spentLabel = formatCurrency(
    budgetMetrics?.spentAmount ?? 0,
    jar.currency,
    locale,
    { maximumFractionDigits: 0 },
  );
  const remainingLabel = formatCurrency(
    budgetMetrics?.remainingAmount ?? 0,
    jar.currency,
    locale,
    { maximumFractionDigits: 0 },
  );

  return (
    <Page
      testId="plan-jar-detail"
      topBar={<TopAppBar title={displayName} subtitle={t("detailSubtitle")} />}
    >
      <PlanOfflineBanner />

      <EmergencyInboxBanner
        items={inboxItems ?? []}
        viewerUserId={user.id}
        title={t("reallocate.emergencyBannerTitle")}
        body={t("reallocate.emergencyBannerBody")}
        openLabel={t("reallocate.emergencyBannerOpen")}
      />

      <Card tone="hero" className="gap-(--space-4) p-(--space-5)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <div>
            <Text
              size="xs"
              className="text-hero-muted uppercase tracking-[0.14em]"
            >
              {t("plannedHeading")}
            </Text>
            <div className="mt-(--space-2)">
              <Amount
                label={t("plannedHeading")}
                amountLabel={plannedLabel}
                size="lg"
                labelClassName="text-hero-muted"
                amountClassName="text-hero-fg"
              />
            </div>
          </div>
          <StatusBadge
            tone={jar.state === JarState.ACTIVE ? "positive" : "neutral"}
            data-testid="jar-state-badge"
          >
            {t(stateKey(jar.state))}
          </StatusBadge>
        </div>
        <div className="flex items-center justify-between gap-(--space-3) border-t border-white/15 pt-(--space-3)">
          <Text size="sm" className="text-hero-muted">
            {t(`kinds.${jar.kind}`)}
          </Text>
          <Text size="sm" className="text-hero-muted">
            {t("incomeModeLabel", {
              mode: t(`incomeModes.${jar.incomeAllocateMode}`),
            })}
          </Text>
        </div>
      </Card>

      <Card
        tone="elevated"
        className="gap-(--space-4) p-(--space-4)"
        data-testid="jar-budget-metrics"
      >
        <div className="grid grid-cols-3 gap-(--space-3)">
          <Amount label={t("budgetLabel")} amountLabel={budgetLabel} />
          <Amount label={t("spentLabel")} amountLabel={spentLabel} />
          <Amount label={t("remainingLabel")} amountLabel={remainingLabel} />
        </div>
        {budgetMetrics ? (
          <Progress
            value={Math.max(0, budgetMetrics.usagePercent)}
            max={100}
            label={t("budget.used", { percent: budgetMetrics.usagePercent })}
            privacyAware
            indicatorClassName={
              budgetMetrics.state === "overspent" ? "bg-danger" : undefined
            }
          />
        ) : null}
      </Card>

      <Section variant="surface" title={t("allocationHeading")}>
        <Text size="sm" tone="secondary">
          {t("incomeModeHint")}
        </Text>
      </Section>

      <div data-testid="jar-monthly-review-info">
        <StatusAlert
          variant="info"
          title={tReview("reviewWithoutBlocking")}
          description={tReview("reviewedBody")}
        />
        <Link
          href={APP_PATH.PLAN_RITUAL}
          className="mt-(--space-2) inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {tReview("open")}
        </Link>
      </div>

      {jar.state === JarState.ACTIVE ? (
        <ReallocateJarForm
          sourceJarId={jar.id}
          sourceJarName={displayName}
          availableToMove={Math.max(
            0,
            budgets?.byJarId[jar.id]?.remainingAmount ?? 0,
          )}
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

      <Link
        href={APP_PATH.PLAN_JARS}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid="jar-back-list"
      >
        {t("backToList")}
      </Link>
    </Page>
  );
}
