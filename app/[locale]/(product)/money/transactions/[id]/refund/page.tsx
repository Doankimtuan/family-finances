import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect, Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  APP_PATH,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  getTransactionReadResult,
  getTransactionAuditChain,
  listAccounts,
  isRefundableStatus,
  AccountType,
  TransactionDirection,
  getTransactionActionCapabilities,
  TransactionReadStatus,
} from "@/modules/ledger/application";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { StatusAlert } from "@/shared/ui/status-alert";
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

  const [t, transactionResult, chain, accountResult] = await Promise.all([
    getTranslations("money"),
    getTransactionReadResult(id),
    getTransactionAuditChain(id),
    listAccounts(),
  ]);

  if (transactionResult.status === TransactionReadStatus.ERROR) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-refund"
      >
        <TopAppBar title={t("detailPage.readErrorTitle")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">
          <StatusAlert
            variant="danger"
            title={t("detailPage.readErrorTitle")}
            description={t("detailPage.readErrorBody")}
          />
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
    );
  }

  const tx =
    transactionResult.status === TransactionReadStatus.OK
      ? transactionResult.transaction
      : null;

  const priorRefunded =
    chain?.reversals
      .filter((leg) => leg.type === TransactionDirection.INCOME)
      .reduce((sum, leg) => sum + leg.amount, 0) ?? 0;

  const maxRefundable = tx ? Math.max(0, tx.amount - priorRefunded) : 0;
  const canRefund =
    tx &&
    getTransactionActionCapabilities(tx).canGenericRefund &&
    isRefundableStatus(tx.status) &&
    maxRefundable > 0;
  const destinationAccounts = (accountResult?.accounts ?? []).filter(
    (account) =>
      !account.isArchived &&
      account.type !== AccountType.CREDIT_CARD &&
      account.type !== AccountType.SAVINGS_PRODUCT &&
      account.canMutate,
  );

  if (!tx) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-refund"
      >
        <TopAppBar title={t("detailPage.notFound")} />
        <div className="px-(--space-4) py-(--space-6)">
          <Link
            href={APP_PATH.MONEY_TRANSACTIONS}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
    );
  }

  if (!canRefund || destinationAccounts.length === 0) {
    const title =
      destinationAccounts.length === 0
        ? t("refundForm.noDestinationTitle")
        : t("refundForm.unavailableTitle");
    const description =
      destinationAccounts.length === 0
        ? t("refundForm.noDestinationBody")
        : t("refundForm.unavailableBody");
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-refund"
      >
        <TopAppBar title={t("refundForm.title")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) pb-(--space-6) pt-(--space-4)">
          <StatusAlert
            variant="warning"
            title={title}
            description={description}
          />
          <Link
            href={moneyTransactionPath(tx.id)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
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
          destinationAccounts={destinationAccounts}
          defaultTransactionDate={todayIsoDate()}
        />
      </div>
    </div>
  );
}
