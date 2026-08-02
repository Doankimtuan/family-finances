import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";
import { ProductStub } from "@/shared/patterns/product-stub";
import { MoneyMembershipGate } from "./money-membership-gate";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  setLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return <MoneyMembershipGate />;
  }

  const t = await getTranslations("money");
  const tEmpty = await getTranslations("emptyStates");

  return (
    <ProductStub
      title={t("title")}
      emptyTitle={tEmpty("moneyTitle")}
      emptyDescription={tEmpty("moneyDescription")}
    />
  );
}
