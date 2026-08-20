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
  listAccountsForCapture,
  listCaptureJars,
  listCategoryTags,
  TransactionDirection,
  TransactionReadStatus,
  TRANSACTION_CORRECTABLE_STATUS_VALUES,
  getTransactionActionCapabilities,
} from "@/modules/ledger/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MoneyOfflineBanner } from "@/app/[locale]/(product)/money/money-offline-banner";
import { CorrectTransactionForm } from "./correct-transaction-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function TransactionCorrectPage({ params }: Props) {
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

  const [t, transactionResult, listed, expenseTags, incomeTags, jars] =
    await Promise.all([
      getTranslations("money"),
      getTransactionReadResult(id),
      listAccountsForCapture(),
      listCategoryTags(TransactionDirection.EXPENSE),
      listCategoryTags(TransactionDirection.INCOME),
      listCaptureJars(),
    ]);

  if (transactionResult.status === TransactionReadStatus.ERROR) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-correct"
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
          >
            {t("detailPage.back")}
          </Link>
        </div>
      </div>
    );
  }

  if (transactionResult.status === TransactionReadStatus.NOT_FOUND) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-correct"
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

  const tx = transactionResult.transaction;
  const canCorrect =
    getTransactionActionCapabilities(tx).canGenericCorrect &&
    (TRANSACTION_CORRECTABLE_STATUS_VALUES as readonly string[]).includes(
      tx.status,
    );

  if (!canCorrect) {
    return (
      <div
        className="flex min-h-full flex-col"
        data-testid="money-transaction-correct"
      >
        <TopAppBar title={t("correctForm.title")} />
        <div className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">
          <StatusAlert
            variant="warning"
            title={t("correctForm.unavailableTitle")}
            description={t("correctForm.unavailableBody")}
          />
          <Link
            href={moneyTransactionPath(tx.id)}
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
      data-testid="money-transaction-correct"
    >
      <TopAppBar
        title={t("correctForm.title")}
        subtitle={t("correctForm.subtitle")}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <CorrectTransactionForm
          transaction={tx}
          accounts={listed?.accounts ?? []}
          expenseTags={expenseTags ?? []}
          incomeTags={incomeTags ?? []}
          jars={jars ?? []}
          currency={listed?.currency ?? tx.currency}
        />
      </div>
    </div>
  );
}
