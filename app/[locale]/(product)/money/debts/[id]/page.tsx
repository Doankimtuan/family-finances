import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getLiability } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { DebtPayForm } from "./debt-pay-form";

type Props = { params: Promise<{ locale: string; id: string }> };

/** money.debt-detail */
export default async function DebtDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tDebts, tProducts, debt] = await Promise.all([
    getTranslations("money.debtDetail"),
    getTranslations("money.debtsPage"),
    getTranslations("money.products"),
    getLiability(id),
  ]);

  if (!debt) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="debt-detail-missing"
      >
        <TopAppBar title={t("title")} />
        <div className="px-(--space-4) pt-(--space-4)">
          <EmptyState
            title={t("notFound")}
            className="flex-none py-(--space-4)"
          />
          <Link
            href={APP_PATH.MONEY_DEBTS}
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col" data-testid="debt-detail">
      <TopAppBar title={debt.name} subtitle={debt.creditor ?? undefined} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Text size="sm" tone="secondary">
          {tProducts("notBankBalance")}
        </Text>
        <Amount
          label={tProducts("owedLabel")}
          amountLabel={formatCurrency(
            debt.remainingAmount,
            debt.currency,
            locale,
            { maximumFractionDigits: 0 },
          )}
          size="lg"
        />
        {debt.dueDay ? (
          <Text size="sm" tone="secondary">
            {tDebts("dueDay", { day: debt.dueDay })}
          </Text>
        ) : null}
        {debt.remainingAmount <= 0 ? (
          <Text size="sm">{t("paidOff")}</Text>
        ) : (
          <DebtPayForm liabilityId={debt.id} maxAmount={debt.remainingAmount} />
        )}
        <Link
          href={APP_PATH.MONEY_DEBTS}
          className="text-sm font-medium text-accent"
          data-testid="debt-detail-back"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
