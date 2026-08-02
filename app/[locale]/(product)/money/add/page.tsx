import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { setLocale } from "@/i18n/set-locale";

type Props = { params: Promise<{ locale: string }> };

/** Alias → blueprint route `money/transactions/new`. */
export default async function MoneyAddAliasPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);
  return redirect({ href: APP_PATH.MONEY_ADD, locale });
}
