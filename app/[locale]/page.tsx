import { redirect } from "@/i18n/navigation";
import { redirect as redirectToPath } from "next/navigation";
import { setLocale } from "@/i18n/set-locale";
import { resolveAuthenticatedEntryPath } from "@/modules/tenancy/application/resolve-authenticated-entry-path";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  AUTH_ADAPTER_CONFIRM_PATH,
  AUTH_CONFIRM_QUERY,
} from "@/modules/tenancy/application/auth-constants";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { WelcomeScreen } from "./(auth)/welcome/welcome-screen";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<LandingSearchParams>;
};

type LandingSearchParams = Partial<
  Record<(typeof AUTH_CONFIRM_QUERY)[keyof typeof AUTH_CONFIRM_QUERY], string>
>;

function hasAuthPayload(params: LandingSearchParams): boolean {
  return Boolean(
    params[AUTH_CONFIRM_QUERY.CODE] ||
    (params[AUTH_CONFIRM_QUERY.TOKEN_HASH] &&
      params[AUTH_CONFIRM_QUERY.TYPE]) ||
    params[AUTH_CONFIRM_QUERY.ERROR] ||
    params[AUTH_CONFIRM_QUERY.ERROR_CODE] ||
    params[AUTH_CONFIRM_QUERY.ERROR_DESCRIPTION],
  );
}

function redirectLegacyAuthPayload(params: LandingSearchParams): never {
  const query = new URLSearchParams();
  const forwardedKeys = [
    AUTH_CONFIRM_QUERY.CODE,
    AUTH_CONFIRM_QUERY.TOKEN_HASH,
    AUTH_CONFIRM_QUERY.TYPE,
    AUTH_CONFIRM_QUERY.ERROR,
    AUTH_CONFIRM_QUERY.ERROR_CODE,
    AUTH_CONFIRM_QUERY.ERROR_DESCRIPTION,
  ] as const;

  for (const key of forwardedKeys) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  query.set(AUTH_CONFIRM_QUERY.NEXT, APP_PATH.RESET_PASSWORD);
  redirectToPath(`${AUTH_ADAPTER_CONFIRM_PATH}?${query.toString()}`);
}

/**
 * Locale root is the Welcome screen itself — the old "Open app" pass-through
 * landing was a redundant hop to /welcome with the same content.
 */
export default async function LandingPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const locale = setLocale(rawLocale);
  const query = await searchParams;

  if (hasAuthPayload(query)) {
    redirectLegacyAuthPayload(query);
  }

  const authenticatedPath = await resolveAuthenticatedEntryPath();
  if (authenticatedPath) {
    return redirect({ href: authenticatedPath, locale });
  }

  return (
    <ChromeShell chrome="auth">
      <WelcomeScreen />
    </ChromeShell>
  );
}
