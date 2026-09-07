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
import { Page } from "@/shared/patterns/page";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MoneyOfflineBanner } from "@/app/[locale]/(product)/money/money-offline-banner";
import { CorrectTransactionForm } from "./correct-transaction-form";
import { TRANSACTION_SURFACE_LINK_CLASS } from "../../transaction-chrome";

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
      <Page
        testId="money-transaction-correct"
        topBar={
          <TopAppBar
            variant="form"
            title={t("detailPage.readErrorTitle")}
            backHref={APP_PATH.MONEY_TRANSACTIONS}
          />
        }
      >
        <StatusAlert
          variant="danger"
          title={t("detailPage.readErrorTitle")}
          description={t("detailPage.readErrorBody")}
        />
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          className={TRANSACTION_SURFACE_LINK_CLASS}
        >
          {t("detailPage.back")}
        </Link>
      </Page>
    );
  }

  if (transactionResult.status === TransactionReadStatus.NOT_FOUND) {
    return (
      <Page
        testId="money-transaction-correct"
        topBar={
          <TopAppBar
            variant="form"
            title={t("detailPage.notFound")}
            backHref={APP_PATH.MONEY_TRANSACTIONS}
          />
        }
      >
        <Link
          href={APP_PATH.MONEY_TRANSACTIONS}
          className={TRANSACTION_SURFACE_LINK_CLASS}
        >
          {t("detailPage.back")}
        </Link>
      </Page>
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
      <Page
        testId="money-transaction-correct"
        topBar={
          <TopAppBar
            variant="form"
            title={t("correctForm.title")}
            backHref={moneyTransactionPath(tx.id)}
          />
        }
      >
        <StatusAlert
          variant="warning"
          title={t("correctForm.unavailableTitle")}
          description={t("correctForm.unavailableBody")}
        />
        <Link
          href={moneyTransactionPath(tx.id)}
          className={TRANSACTION_SURFACE_LINK_CLASS}
        >
          {t("detailPage.back")}
        </Link>
      </Page>
    );
  }

  return (
    <Page
      testId="money-transaction-correct"
      contentClassName="gap-(--space-5) pb-0"
      topBar={
        <TopAppBar
          variant="form"
          title={t("correctForm.title")}
          subtitle={t("correctForm.subtitle")}
          backHref={moneyTransactionPath(tx.id)}
        />
      }
    >
      <MoneyOfflineBanner />
      <CorrectTransactionForm
        transaction={tx}
        accounts={listed?.accounts ?? []}
        expenseTags={expenseTags ?? []}
        incomeTags={incomeTags ?? []}
        jars={jars ?? []}
        currency={listed?.currency ?? tx.currency}
      />
    </Page>
  );
}
