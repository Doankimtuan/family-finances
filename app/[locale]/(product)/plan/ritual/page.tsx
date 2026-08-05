import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getMonthRitual,
  runMonthRitualAutolockWorker,
} from "@/modules/plan/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { PlanOfflineBanner } from "../plan-offline-banner";
import { RitualWizard } from "./ritual-wizard";

type Props = { params: Promise<{ locale: string }> };

/**
 * plan.month-ritual — Assisted preview → approve → lock (ST-E04).
 */
export default async function PlanRitualPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  // Best-effort BR-08 sweep — do not block ritual render.
  void runMonthRitualAutolockWorker();

  const [t, ritual] = await Promise.all([
    getTranslations("plan.ritual"),
    getMonthRitual(),
  ]);

  return (
    <div className="flex min-h-full flex-col" data-testid="plan-ritual-page">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <PlanOfflineBanner />

        {ritual ? (
          <RitualWizard ritual={ritual} />
        ) : (
          <EmptyState
            title={t("unavailableTitle")}
            description={t("unavailableBody")}
            className="flex-none py-(--space-4)"
          />
        )}

        <Link
          href={APP_PATH.PLAN}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="ritual-back-plan"
        >
          {t("backToPlan")}
        </Link>
      </div>
    </div>
  );
}
