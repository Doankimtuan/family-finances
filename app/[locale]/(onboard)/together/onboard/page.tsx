import { redirect } from "@/i18n/navigation";
import { setLocale } from "@/i18n/set-locale";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { OnboardWizardScreen } from "./onboard-wizard-screen";

type Props = { params: Promise<{ locale: string }> };

export default async function OnboardPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    return redirect({ href: APP_PATH.LOGIN, locale });
  }

  const membership = await resolveActiveMembership(user.id);
  if (membership) {
    return redirect({ href: APP_PATH.HOME, locale });
  }

  return <OnboardWizardScreen />;
}
