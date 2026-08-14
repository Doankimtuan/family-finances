import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { listTransactionTags } from "@/modules/ledger/application";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { TransactionTagManagement } from "../transaction-tag-management";

type Props = { params: Promise<{ locale: string }> };

export default async function TransactionTagsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) return redirect({ href: APP_PATH.LOGIN, locale });
  const membership = await resolveActiveMembership(user.id);
  if (!membership) return redirect({ href: APP_PATH.ONBOARD, locale });

  const [t, tags] = await Promise.all([
    getTranslations("money"),
    listTransactionTags({ includeArchived: true }),
  ]);

  return (
    <Page
      testId="money-transaction-tags"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_TRANSACTIONS}
          title={t("transactionTags.title")}
          subtitle={t("transactionTags.subtitle")}
        />
      }
    >
      <TransactionTagManagement initialTags={tags ?? []} />
    </Page>
  );
}
