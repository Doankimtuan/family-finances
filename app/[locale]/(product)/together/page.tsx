import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { ProductStub } from "@/shared/patterns/product-stub";
import { TogetherPreferences } from "@/shared/patterns/together-preferences";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { AccountLifecycleCard } from "./account-lifecycle-card";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setLocale(locale);

  const tNav = await getTranslations("navigation");
  const tEmpty = await getTranslations("emptyStates");
  const tSettings = await getTranslations("settings");
  const sessionUser = await getSessionUser();

  return (
    <ProductStub
      title={tNav("together")}
      lead={
        <>
          <p className="text-sm text-text-secondary">
            {tSettings("preferences")}
          </p>
          <TogetherPreferences />
          {sessionUser ? <AccountLifecycleCard /> : null}
        </>
      }
      emptyTitle={tEmpty("togetherTitle")}
      emptyDescription={tEmpty("togetherDescription")}
    />
  );
}
