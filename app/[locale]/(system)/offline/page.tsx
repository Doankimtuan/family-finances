import { setLocale } from "@/i18n/set-locale";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { SystemOfflineScreen } from "./system-offline-screen";

type Props = { params: Promise<{ locale: string }> };

/** system.offline — `/offline`. */
export default async function SystemOfflinePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  return <SystemOfflineScreen />;
}
