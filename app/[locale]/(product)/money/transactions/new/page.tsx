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
} from "@/modules/ledger/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Page } from "@/shared/patterns/page";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { MoneyCaptureEntry } from "../money-capture-entry";

type Props = { params: Promise<{ locale: string }> };

/**
 * money.transaction-add — capture <15s (ST-E04-002) + owned-account transfer.
 */
export default async function MoneyTransactionAddPage({ params }: Props) {
  const { locale: rawLocale } = await params;
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

  return (
    <Page
      testId="money-transaction-add"
      className="h-full min-h-0 overflow-hidden"
      contentClassName="min-h-0 overflow-hidden pb-0"
      topBar={
        <TopAppBar
          title={t("capture")}
          subtitle={t("captureForm.subtitle")}
          variant="form"
          backHref={APP_PATH.MONEY_TRANSACTIONS}
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
      />
    </Page>
  );
}
