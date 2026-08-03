import { setLocale } from "@/i18n/set-locale";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { SystemErrorScreen } from "./system-error-screen";

type Props = { params: Promise<{ locale: string }> };

/** system.error — `/error` deep link. */
export default async function SystemErrorRoutePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  return <SystemErrorScreen />;
}
