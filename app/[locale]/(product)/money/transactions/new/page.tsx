import { getTranslations } from "next-intl/server";
import {
  withPerfSpan,
  PERF_TRACE_OP,
} from "@/modules/platform/application/perf-trace";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
import {
  isCaptureAccountType,
  listCaptureAccountReferences,
  listCaptureJars,
  listCategoryTags,
  listTransactionTags,
  TransactionDirection,
  MoneyCaptureMode,
  MONEY_CAPTURE_MODE_OPTIONS,
  TRANSACTION_ACCOUNT_QUERY_PARAM,
  TRANSACTION_CAPTURE_MODE_QUERY_PARAM,
} from "@/modules/ledger/application";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { MoneyCaptureEntry } from "../money-capture-entry";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * money.transaction-add — capture <15s (ST-E04-002) + owned-account transfer.
 */
export default async function MoneyTransactionAddPage({
  params,
  searchParams,
}: Props) {
  const { locale: rawLocale } = await params;
  const query = await searchParams;
  await withPerfSpan(PERF_TRACE_OP.TRANSACTION_SESSION_GATE, () =>
    requireProductSession({ localeParam: rawLocale }),
  );

  const accountReferences = listCaptureAccountReferences();
  const accountsPromise = accountReferences.accounts.then(
    (accounts) =>
      accounts?.filter(
        (account) =>
          !account.isArchived &&
          account.canMutate &&
          isCaptureAccountType(account.type),
      ) ?? [],
  );
  const expenseTagsPromise = listCategoryTags(TransactionDirection.EXPENSE);
  const incomeTagsPromise = listCategoryTags(TransactionDirection.INCOME);
  const jarsPromise = listCaptureJars();
  const transactionTagsPromise = listTransactionTags();
  const [t, currency] = await Promise.all([
    getTranslations("money"),
    accountReferences.currency,
  ]);
  const requestedAccountId = query[TRANSACTION_ACCOUNT_QUERY_PARAM];
  const initialAccountId =
    typeof requestedAccountId === "string" ? requestedAccountId : undefined;
  const initialMode =
    MONEY_CAPTURE_MODE_OPTIONS.find(
      (mode) => mode === query[TRANSACTION_CAPTURE_MODE_QUERY_PARAM],
    ) ?? MoneyCaptureMode.EXPENSE;

  return (
    <Page
      testId="money-transaction-add"
      className="shrink-0"
      contentClassName="pb-0"
      topBar={
        <TopAppBar
          title={t("capture")}
          subtitle={t("captureForm.subtitle")}
          variant={TopAppBarVariant.PRIMARY}
        />
      }
    >
      <MoneyOfflineBanner />
      <MoneyCaptureEntry
        accountsPromise={accountsPromise}
        expenseTagsPromise={expenseTagsPromise}
        incomeTagsPromise={incomeTagsPromise}
        jarsPromise={jarsPromise}
        transactionTagsPromise={transactionTagsPromise}
        currency={currency}
        initialAccountId={initialAccountId}
        initialMode={initialMode}
      />
    </Page>
  );
}
