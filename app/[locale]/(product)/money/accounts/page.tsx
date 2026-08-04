import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

type Props = { params: Promise<{ locale: string }> };

/**
 * Accounts index retired — Money hub owns the scan list + create flow.
 * Keep /money/accounts/[id] for detail; redirect the list route.
 */
export default async function AccountsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);
  return redirect({ href: APP_PATH.MONEY, locale });
}
