import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  isCaptureAccountType,
  listAccountsForCapture,
  listCaptureJars,
  listCategoryTags,
  listTransactionTags,
  DEFAULT_CURRENCY,
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

  const [t, listed, expenseTags, incomeTags, jars, transactionTags] =
    await Promise.all([
      getTranslations("money"),
      listAccountsForCapture(),
      listCategoryTags(TransactionDirection.EXPENSE),
      listCategoryTags(TransactionDirection.INCOME),
      listCaptureJars(),
      listTransactionTags(),
    ]);
  const accounts = (listed?.accounts ?? []).filter(
    (account) =>
      !account.isArchived &&
      account.canMutate &&
      isCaptureAccountType(account.type),
  );
  const requestedAccountId = query[TRANSACTION_ACCOUNT_QUERY_PARAM];
  const initialAccountId =
    typeof requestedAccountId === "string" &&
    accounts.some((account) => account.id === requestedAccountId)
      ? requestedAccountId
      : undefined;
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
        accounts={accounts}
        expenseTags={expenseTags ?? []}
        incomeTags={incomeTags ?? []}
        jars={jars ?? []}
        transactionTags={transactionTags ?? []}
        currency={listed?.currency ?? DEFAULT_CURRENCY}
        initialAccountId={initialAccountId}
        initialMode={initialMode}
      />
    </Page>
  );
}
