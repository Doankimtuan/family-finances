import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyCardPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listInstallmentPlans } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { InstallmentCard } from "@/shared/patterns/installment-card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../money-offline-banner";
import { CreateInstallmentForm } from "./create-installment-form";

type Props = { params: Promise<{ locale: string }> };

/** money.cards — installments / EMI (AC-011). */
export default async function CardsPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tMoney, tProducts, plans] = await Promise.all([
    getTranslations("money.cardsPage"),
    getTranslations("money"),
    getTranslations("money.products"),
    listInstallmentPlans(),
  ]);

  const loadFailed = plans == null;
  const list = plans ?? [];

  return (
    <div className="flex min-h-full flex-col" data-testid="money-cards">
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Text size="sm" tone="secondary">
          {tProducts("notBankBalance")}
        </Text>
        <CreateInstallmentForm />
        {loadFailed ? (
          <StatusAlert
            variant="danger"
            title={t("emptyTitle")}
            description={tProducts("errors.unknown")}
          />
        ) : list.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            className="flex-none py-(--space-4)"
          />
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {list.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={moneyCardPath(plan.id)}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <InstallmentCard
                    title={plan.name}
                    subtitle={plan.cardLabel ?? undefined}
                    progressLabel={t("progress", {
                      paid: plan.paidInstallments,
                      total: plan.numInstallments,
                    })}
                    amountLabel={formatCurrency(
                      plan.installmentAmount,
                      plan.currency,
                      locale,
                      { maximumFractionDigits: 0 },
                    )}
                    statusLabel={t(`status.${plan.status}`)}
                    status={plan.status}
                    data-testid={`card-row-${plan.id}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={APP_PATH.MONEY}
          className="text-sm font-medium text-accent"
          data-testid="cards-back-money"
        >
          {tMoney("backToMoney")}
        </Link>
      </div>
    </div>
  );
}
