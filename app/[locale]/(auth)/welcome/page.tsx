import { redirect } from "@/i18n/navigation";
import { setLocale } from "@/i18n/set-locale";
import { resolveAuthenticatedEntryPath } from "@/modules/tenancy/application/resolve-authenticated-entry-path";
import { WelcomeScreen } from "./welcome-screen";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function WelcomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = setLocale(rawLocale);

  const authenticatedPath = await resolveAuthenticatedEntryPath();
  if (authenticatedPath) {
    return redirect({ href: authenticatedPath, locale });
  }

  return <WelcomeScreen />;
}
