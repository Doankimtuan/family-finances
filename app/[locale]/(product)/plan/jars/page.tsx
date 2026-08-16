import { getTranslations } from "next-intl/server";
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
  type PlanJar,
  DEFAULT_CURRENCY,
  JarState,
  JarPlanKind,
  listJarCategories,
} from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { JarCard } from "@/shared/patterns/jar-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { CreateJarForm } from "./create-jar-form";
import { CreateCategoryForm } from "./create-category-form";
import type { CaptureJarOption } from "@/modules/ledger/application/client";

type Props = { params: Promise<{ locale: string }> };

function stateLabelKey(state: PlanJar["state"]) {
  if (state === JarState.PAUSED) return "statePaused" as const;
  if (state === JarState.ARCHIVED) return "stateArchived" as const;
  return "stateActive" as const;
}

function planSummary(
  jar: PlanJar,
  t: (key: string, values?: Record<string, string | number>) => string,
  currency: string,
  locale: string,
): string {
  if (!jar.plan) return t("planNone");
  if (jar.plan.kind === JarPlanKind.FIXED) {
    return t("planFixed", {
      amount: formatCurrency(jar.plan.fixedAmount, currency, locale, {
        maximumFractionDigits: 0,
      }),
    });
  }
  return t("planPercent", {
    percent: Math.round(jar.plan.percentBps / 100),
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
  const incomeMode = listed?.incomeAllocateMode ?? "suggest";
  const categoryJars: CaptureJarOption[] = active.map((jar) => ({
    id: jar.id,
    name: jar.name,
    kind: jar.kind,
  }));
  const allocationHealth = calculateAllocationHealth(
    active,
    budgets?.periodIncome ?? 0,
  );
  const allocationDescription =
    allocationHealth.status === "over_allocated"
      ? t("allocationHealthOver", {
          percent: allocationHealth.utilizationPercent,
        })
      : allocationHealth.status === "under_allocated"
        ? t("allocationHealthUnder", {
            percent: allocationHealth.utilizationPercent,
          })
        : allocationHealth.status === "no_income"
          ? t("allocationHealthNoIncome")
          : t("allocationHealthBalanced");

  return (
    <Page
      testId="plan-jars"
      topBar={<TopAppBar title={t("listTitle")} subtitle={t("listSubtitle")} />}
    >
      <PlanOfflineBanner />

      {active.length > 0 ? (
        <StatusAlert
          variant={
            allocationHealth.status === "over_allocated" ? "warning" : "info"
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

      <Section title={t("activeSection")}>
        {active.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {active.map((jar) => (
              <li key={jar.id}>
                <Link href={planJarPath(jar.id)} className="block">
                  <JarCard
                    name={jar.isNameCustom ? jar.name : localizeCatalogName(tCatalog, "jars", jar.name)}
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

      <Section title={t("nonTargetSection")}>
        {nonTargets.length === 0 ? (
          <Text size="sm" tone="secondary">
            {t("nonTargetEmpty")}
          </Text>
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {nonTargets.map((jar) => (
              <li key={jar.id}>
                <Link href={planJarPath(jar.id)} className="block">
                  <JarCard
                    name={jar.isNameCustom ? jar.name : localizeCatalogName(tCatalog, "jars", jar.name)}
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

      <CreateJarForm
        categories={listedCategories ?? []}
        availableJars={active.map((jar) => ({ id: jar.id, name: jar.name }))}
        currency={currency}
        qualifyingIncome={budgets?.qualifyingIncome ?? null}
      />
      <CreateCategoryForm jars={categoryJars} />

      <Link
        href={APP_PATH.PLAN}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("backToPlan")}
      </Link>
    </Page>
  );
}
