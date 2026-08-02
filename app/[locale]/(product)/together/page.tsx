import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { ProductStub } from "@/shared/patterns/product-stub";
import { TogetherPreferences } from "@/shared/patterns/together-preferences";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setLocale(locale);

  const tNav = await getTranslations("navigation");
  const tEmpty = await getTranslations("emptyStates");
  const tSettings = await getTranslations("settings");

  return (
    <ProductStub
      title={tNav("together")}
      lead={
        <div className="flex flex-col gap-(--space-3)">
          <p className="text-sm text-text-secondary">
            {tSettings("preferences")}
          </p>
          <TogetherPreferences />
        </div>
      }
      emptyTitle={tEmpty("togetherTitle")}
      emptyDescription={tEmpty("togetherDescription")}
    />
  );
}
