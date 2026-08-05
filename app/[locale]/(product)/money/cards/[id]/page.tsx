import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { routing } from "@/i18n/routing";
import { moneyLoanPath } from "@/modules/tenancy/application/app-path";

type Props = { params: Promise<{ locale: string; id: string }> };

/** Compatibility redirect: /money/cards/[id] → /money/loans/[id]. */
export default async function CardDetailRedirectPage({ params }: Props) {
  const { locale: raw, id } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  return redirect({ href: moneyLoanPath(id), locale });
}
