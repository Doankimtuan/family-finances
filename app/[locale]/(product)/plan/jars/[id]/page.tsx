import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getJar,
  JarState,
  type JarState as JarStateValue,
} from "@/modules/plan/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { SectionHeader } from "@/shared/patterns/section-header";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { PlanOfflineBanner } from "../../plan-offline-banner";
import { JarDetailControls } from "./jar-detail-controls";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function stateKey(state: JarStateValue) {
  if (state === JarState.PAUSED) return "statePaused" as const;
  if (state === JarState.ARCHIVED) return "stateArchived" as const;
  return "stateActive" as const;
}

/**
 * plan.jar-detail — Planned amount (not Balance), state, allocation (ST-E05-002).
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

  const [t, tCatalog, jar] = await Promise.all([
    getTranslations("plan.jars"),
    getTranslations("catalog"),
    getJar(id),
  ]);

  if (!jar) {
    return (
      <div className="flex min-h-full flex-col" data-testid="plan-jar-detail">
        <TopAppBar title={t("notFound")} />
        <div className="px-(--space-4) py-(--space-6)">
          <Link
            href={APP_PATH.PLAN_JARS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = localizeCatalogName(tCatalog, "jars", jar.name);
  let plannedLabel = t("planNone");
  if (jar.plan?.kind === "percent") {
    plannedLabel = t("planPercent", {
      percent: Math.round(jar.plan.percentBps / 100),
    });
  } else if (jar.plan?.kind === "fixed") {
    plannedLabel = formatCurrency(jar.plan.fixedAmount, jar.currency, locale, {
      maximumFractionDigits: 0,
    });
  }

  return (
    <div className="flex min-h-full flex-col" data-testid="plan-jar-detail">
      <TopAppBar title={displayName} subtitle={t("detailSubtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <PlanOfflineBanner />

        <Amount
          label={t("plannedHeading")}
          amountLabel={plannedLabel}
          size="lg"
        />

        <div className="flex items-center justify-between gap-(--space-3)">
          <Text size="sm" tone="secondary">
            {t(`kinds.${jar.kind}`)}
          </Text>
          <span
            className="rounded-md border border-border-subtle px-(--space-2) py-(--space-1) text-xs font-medium text-text-secondary"
            data-testid="jar-state-badge"
          >
            {t(stateKey(jar.state))}
          </span>
        </div>

        <section className="flex flex-col gap-(--space-2)">
          <SectionHeader title={t("allocationHeading")} />
          <Text size="sm" tone="secondary">
            {t("incomeModeLabel", {
              mode: t(`incomeModes.${jar.incomeAllocateMode}`),
            })}
          </Text>
          <Text size="sm" tone="secondary">
            {t("incomeModeHint")}
          </Text>
        </section>

        <div data-testid="jar-ritual-lock">
          <StatusAlert
            variant="info"
            title={t("ritualLockTitle")}
            description={t("ritualLockBody")}
          />
          <Link
            href={APP_PATH.PLAN_RITUAL}
            className="mt-(--space-2) inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("ritualLockOpen")}
          </Link>
        </div>

        <JarDetailControls jarId={jar.id} state={jar.state} plan={jar.plan} />

        <Link
          href={APP_PATH.PLAN_JARS}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="jar-back-list"
        >
          {t("backToList")}
        </Link>
      </div>
    </div>
  );
}
