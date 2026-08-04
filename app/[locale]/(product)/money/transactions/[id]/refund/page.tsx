import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getTransaction,
  getTransactionAuditChain,
  isRefundableStatus,
  TransactionDirection,
} from "@/modules/ledger/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { MoneyOfflineBanner } from "@/app/[locale]/(product)/money/money-offline-banner";
import { RefundTransactionForm } from "./refund-transaction-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function TransactionRefundPage({ params }: Props) {
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

  const [t, tx, chain] = await Promise.all([
    getTranslations("money"),
    getTransaction(id),
    getTransactionAuditChain(id),
  ]);

  const priorRefunded =
    chain?.reversals
      .filter((leg) => leg.type === TransactionDirection.INCOME)
      .reduce((sum, leg) => sum + leg.amount, 0) ?? 0;

  const maxRefundable = tx ? Math.max(0, tx.amount - priorRefunded) : 0;
  const canRefund =
    tx &&
    tx.type === TransactionDirection.EXPENSE &&
    isRefundableStatus(tx.status) &&
    maxRefundable > 0;

  if (!tx || !canRefund) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-refund"
      >
        <TopAppBar title={t("detailPage.notFound")} />
        <div className="px-(--space-4) py-(--space-6)">
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-transaction-refund"
    >
      <TopAppBar
        title={t("refundForm.title")}
        subtitle={t("refundForm.subtitle")}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <RefundTransactionForm
          transaction={tx}
          currency={tx.currency}
          maxRefundable={maxRefundable}
        />
      </div>
    </div>
  );
}
