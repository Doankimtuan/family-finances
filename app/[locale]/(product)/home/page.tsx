import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { ProductStub } from "@/shared/patterns/product-stub";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setLocale(locale);

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
