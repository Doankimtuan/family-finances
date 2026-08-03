import { setLocale } from "@/i18n/set-locale";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { SystemPermissionScreen } from "./system-permission-screen";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
};

/** system.permission — `/permission`. */
export default async function SystemPermissionPage({
  params,
  searchParams,
}: Props) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  setLocale(locale);

  const { reason: rawReason } = await searchParams;
  const reason = rawReason === "general" ? "general" : "admin";

  return <SystemPermissionScreen reason={reason} />;
}
