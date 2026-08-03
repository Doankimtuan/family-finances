import { setLocale } from "@/i18n/set-locale";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { SystemMaintenanceScreen } from "./system-maintenance-screen";

type Props = { params: Promise<{ locale: string }> };

/** system.maintenance — `/maintenance`. */
export default async function SystemMaintenancePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);
  return <SystemMaintenanceScreen />;
}
