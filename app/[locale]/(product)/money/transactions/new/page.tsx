import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import {
  listAccounts,
  listCaptureJars,
  listCategoryTags,
  DEFAULT_CURRENCY,
  TransactionDirection,
} from "@/modules/ledger/application";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { MoneyOfflineBanner } from "../../money-offline-banner";
import { CaptureTransactionForm } from "../capture-transaction-form";

type Props = { params: Promise<{ locale: string }> };

/**
 * money.transaction-add — capture <15s (ST-E04-002).
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

  const [t, listed, expenseTags, incomeTags, jars] = await Promise.all([
    getTranslations("money"),
    listAccounts(),
    listCategoryTags(TransactionDirection.EXPENSE),
    listCategoryTags(TransactionDirection.INCOME),
    listCaptureJars(),
  ]);

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="money-transaction-add"
    >
      <TopAppBar title={t("capture")} subtitle={t("captureForm.subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <MoneyOfflineBanner />
        <CaptureTransactionForm
          accounts={listed?.accounts ?? []}
          expenseTags={expenseTags ?? []}
          incomeTags={incomeTags ?? []}
          jars={jars ?? []}
          currency={listed?.currency ?? DEFAULT_CURRENCY}
        />
      </div>
    </div>
  );
}
