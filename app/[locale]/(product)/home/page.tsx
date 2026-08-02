import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { ProductStub } from "@/shared/patterns/product-stub";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (user) {
    const membership = await resolveActiveMembership(user.id);
    if (!membership) {
      return redirect({ href: APP_PATH.ONBOARD, locale });
    }
  }

  const tNav = await getTranslations("navigation");
  const tEmpty = await getTranslations("emptyStates");

  return (
    <ProductStub
      title={tNav("home")}
      lead={tEmpty("homeLead")}
      emptyTitle={tEmpty("homeTitle")}
      emptyDescription={tEmpty("homeDescription")}
      showBrand
    />
  );
}
