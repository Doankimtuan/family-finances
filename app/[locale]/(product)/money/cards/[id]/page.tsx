import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { getInstallmentPlan } from "@/modules/ledger/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Amount } from "@/shared/patterns/amount";
import { EmptyState } from "@/shared/patterns/empty-state";
import { Text } from "@/shared/ui/text";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { InstallmentPayAction } from "./installment-pay-action";

type Props = { params: Promise<{ locale: string; id: string }> };

/** money.cards detail — EMI payment / complete → Inbox (AC-011). */
export default async function CardDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  if (!(await resolveActiveMembership(user.id))) {
    return redirect({ href: APP_PATH.ONBOARD, locale });
  }

  const [t, tCards, tProducts, plan] = await Promise.all([
    getTranslations("money.cardDetail"),
    getTranslations("money.cardsPage"),
    getTranslations("money.products"),
    getInstallmentPlan(id),
  ]);

  if (!plan) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="card-detail-missing"
      >
        <TopAppBar title={t("title")} />
        <div className="px-(--space-4) pt-(--space-4)">
          <EmptyState
            title={t("notFound")}
            className="flex-none py-(--space-4)"
          />
          <Link
            href={APP_PATH.MONEY_CARDS}
            className="text-sm font-medium text-accent"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col" data-testid="card-detail">
      <TopAppBar title={plan.name} subtitle={plan.cardLabel ?? undefined} />
      <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <Text size="sm" tone="secondary">
          {tProducts("notBankBalance")}
        </Text>
        <Amount
          label={tProducts("installmentLabel")}
          amountLabel={formatCurrency(
            plan.installmentAmount,
            plan.currency,
            locale,
            { maximumFractionDigits: 0 },
          )}
          size="lg"
        />
        <Text size="sm" tone="secondary">
          {tCards("progress", {
            paid: plan.paidInstallments,
            total: plan.numInstallments,
          })}
        </Text>
        {plan.status === "completed" ? (
          <>
            <Text size="sm">{t("completed")}</Text>
            <Link
              href={APP_PATH.INBOX}
              className="inline-flex min-h-11 items-center text-sm font-medium text-accent"
              data-testid="card-complete-inbox"
            >
              {t("openInbox")}
            </Link>
          </>
        ) : (
          <>
            <Text size="sm" tone="secondary">
              {t("completeHint")}
            </Text>
            <InstallmentPayAction planId={plan.id} />
          </>
        )}
        <Link
          href={APP_PATH.MONEY_CARDS}
          className="text-sm font-medium text-accent"
          data-testid="card-detail-back"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
