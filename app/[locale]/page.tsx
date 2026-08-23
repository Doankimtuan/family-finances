import { redirect } from "@/i18n/navigation";
import { setLocale } from "@/i18n/set-locale";
import { resolveAuthenticatedEntryPath } from "@/modules/tenancy/application/resolve-authenticated-entry-path";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { WelcomeScreen } from "./(auth)/welcome/welcome-screen";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Locale root is the Welcome screen itself — the old "Open app" pass-through
 * landing was a redundant hop to /welcome with the same content.
 */
export default async function LandingPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = setLocale(rawLocale);

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
