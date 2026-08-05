import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

type Props = { params: Promise<{ locale: string }> };

/** Compatibility redirect: /money/cards → /money/loans. */
export default async function CardsRedirectPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  return redirect({ href: APP_PATH.MONEY_LOANS, locale });
}
