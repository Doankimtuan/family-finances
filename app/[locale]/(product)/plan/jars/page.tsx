import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH, planJarPath } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listJars,
  getCurrentJarBudgets,
  calculateAllocationHealth,
  type AllocationHealth,
  type PlanJar,
  DEFAULT_CURRENCY,
  JarState,
  JarPlanKind,
  listJarCategories,
  AllocationHealthStatus,
  IncomeAllocateMode,
} from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { basisPointsToPercentage } from "@/shared/utils/percentage";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { JarCard } from "@/shared/patterns/jar-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { PLAN_ICONS } from "@/shared/ui/icon-registry";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { PlanSectionTitle } from "../plan-section-title";
import { CreateJarForm } from "./create-jar-form";
import { CreateCategoryForm } from "./create-category-form";
import { PlanDisclosure } from "../plan-disclosure";
import type { CaptureJarOption } from "@/modules/ledger/application/client";

type Props = { params: Promise<{ locale: string }> };

/** Plain-key + rich-tag subset of the next-intl translator used by planSummary. */
type JarPlanTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  rich: (
    key: string,
    values?: Record<string, string | ((chunks: ReactNode) => ReactNode)>,
  ) => ReactNode;
};

function stateLabelKey(state: PlanJar["state"]) {
  if (state === JarState.PAUSED) return "statePaused" as const;
  if (state === JarState.ARCHIVED) return "stateArchived" as const;
  return "stateActive" as const;
}

function allocationHealthCopy(
  health: AllocationHealth,
  t: JarPlanTranslator,
): string {
  switch (health.status) {
    case AllocationHealthStatus.OVER_ALLOCATED:
      return t("allocationHealthOver", {
        percent: health.utilizationPercent,
      });
    case AllocationHealthStatus.UNDER_ALLOCATED:
      return t("allocationHealthUnder", {
        percent: health.utilizationPercent,
      });
    case AllocationHealthStatus.NO_INCOME:
      return t("allocationHealthNoIncome");
    default:
      return t("allocationHealthBalanced");
  }
}

function planSummary(
  jar: PlanJar,
  t: JarPlanTranslator,
  currency: string,
  locale: string,
): ReactNode {
  if (!jar.plan) return t("planNone");
  if (jar.plan.kind === JarPlanKind.FIXED) {
    return t.rich("planFixed", {
      amount: formatCurrency(jar.plan!.fixedAmount, currency, locale, {
        maximumFractionDigits: 0,
      }),
      money: (chunks: ReactNode) => <FinancialValue>{chunks}</FinancialValue>,
    });
  }
  return t("planPercent", {
    percent: Math.round(basisPointsToPercentage(jar.plan.percentBps)),
  });
}

/**
 * plan.jars — Active allocation targets + Paused/Archived (ST-E05-002 / F3).
 */
export default async function PlanJarsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
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

  const [t, tCatalog, listed, budgets, listedCategories] = await Promise.all([
    getTranslations("plan.jars"),
    getTranslations("catalog"),
    listJars(),
    getCurrentJarBudgets(),
    listJarCategories(),
  ]);

  const currency = listed?.currency ?? DEFAULT_CURRENCY;
  const active = listed?.active ?? [];
  const nonTargets = [...(listed?.paused ?? []), ...(listed?.archived ?? [])];
  const incomeMode = listed?.incomeAllocateMode ?? IncomeAllocateMode.SUGGEST;
  const categoryJars: CaptureJarOption[] = active.map((jar) => ({
    id: jar.id,
    name: jar.name,
    kind: jar.kind,
  }));
  const allocationHealth = calculateAllocationHealth(
    active,
    budgets?.periodIncome ?? 0,
  );
  const allocationDescription = allocationHealthCopy(
    allocationHealth,
    t as unknown as JarPlanTranslator,
  );

  return (
    <Page
      testId="plan-jars"
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.DETAIL}
          title={t("listTitle")}
          subtitle={t("listSubtitle")}
          backHref={APP_PATH.PLAN}
          backLabel={t("backToPlan")}
        />
      }
    >
      <PlanOfflineBanner />

      {active.length > 0 ? (
        <StatusAlert
          variant={
            allocationHealth.status === AllocationHealthStatus.OVER_ALLOCATED
              ? AlertVariant.WARNING
              : AlertVariant.INFO
          }
          title={t("allocationHealthTitle")}
          description={allocationDescription}
        />
      ) : null}

      <Text size="sm" tone="secondary">
        {t("incomeModeLabel", {
          mode: t(`incomeModes.${incomeMode}`),
        })}
      </Text>

      <Section
        title={<PlanSectionTitle>{t("activeSection")}</PlanSectionTitle>}
        testId="plan-jars-active"
      >
        {active.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            icon={<AppIcon icon={PLAN_ICONS.jar} size={AppIconSize.DISPLAY} />}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {active.map((jar) => (
              <li key={jar.id}>
                <Link href={planJarPath(jar.id)} className="block">
                  <JarCard
                    name={
                      jar.isNameCustom
                        ? jar.name
                        : localizeCatalogName(tCatalog, "jars", jar.name)
                    }
                    kindLabel={t(`kinds.${jar.kind}`)}
                    stateLabel={t(stateLabelKey(jar.state))}
                    state={jar.state}
                    planLabel={planSummary(jar, t as never, currency, locale)}
                    data-testid={`jar-card-${jar.id}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={<PlanSectionTitle>{t("nonTargetSection")}</PlanSectionTitle>}
        testId="plan-jars-non-target"
      >
        {nonTargets.length === 0 ? (
          <Text size="sm" tone="secondary">
            {t("nonTargetEmpty")}
          </Text>
        ) : (
          <PlanDisclosure
            showLabel={t("nonTargetShow", { count: nonTargets.length })}
            hideLabel={t("nonTargetHide")}
            testId="plan-jars-non-target-toggle"
          >
            <ul className="flex flex-col gap-(--space-2)">
              {nonTargets.map((jar) => (
                <li key={jar.id}>
                  <Link href={planJarPath(jar.id)} className="block">
                    <JarCard
                      name={
                        jar.isNameCustom
                          ? jar.name
                          : localizeCatalogName(tCatalog, "jars", jar.name)
                      }
                      kindLabel={t(`kinds.${jar.kind}`)}
                      stateLabel={t(stateLabelKey(jar.state))}
                      state={jar.state}
                      planLabel={planSummary(jar, t as never, currency, locale)}
                      data-testid={`jar-card-${jar.id}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </PlanDisclosure>
        )}
      </Section>

      <CreateJarForm
        categories={listedCategories ?? []}
        availableJars={active.map((jar) => ({ id: jar.id, name: jar.name }))}
        currency={currency}
        qualifyingIncome={budgets?.qualifyingIncome ?? null}
      />
      <CreateCategoryForm jars={categoryJars} />
    </Page>
  );
}
