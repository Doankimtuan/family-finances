import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneySavingsPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getSaving,
  previewEarlyWithdrawal,
  shouldWarnPenalty,
  CycleStatus,
  InterestCalcMethod,
} from "@/modules/savings/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { EmptyState } from "@/shared/patterns/empty-state";
import { MoneyOfflineBanner } from "../../../money-offline-banner";
import { EarlyWithdrawForm } from "./early-withdraw-form";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EarlyWithdrawPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, saving] = await Promise.all([
    getTranslations("money.savingsEarlyWithdraw"),
    getSaving(id),
  ]);

  const cycle = saving?.latestCycle;
  if (!saving || !cycle || cycle.status !== CycleStatus.ACTIVE) {
    return (
      <div className="flex min-h-full flex-col">
        <TopAppBar title={t("title")} />
        <div className="px-(--space-4) pt-(--space-4)">
          <EmptyState title={t("title")} className="flex-none py-(--space-4)" />
          <Link
            href={moneySavingsPath(id)}
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  const preview = previewEarlyWithdrawal({
    principal: cycle.principal,
    annualRate: cycle.lockedRate,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    withdrawalDate: new Date().toISOString().slice(0, 10),
    interestMethod:
      saving.productSnapshot.interestCalculationMethod ??
      InterestCalcMethod.SIMPLE,
    packageSnapshot: cycle.packageSnapshot,
  });

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-savings-early-withdraw"
    >
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <EarlyWithdrawForm
          savingId={saving.id}
          cycleId={cycle.id}
          preview={{
            ...preview,
            warnPenalty: shouldWarnPenalty(preview),
          }}
        />
      </div>
    </div>
  );
}
