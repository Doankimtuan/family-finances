import { getTranslations } from "next-intl/server";
import { setLocale } from "@/i18n/set-locale";
import { ProductStub } from "@/shared/patterns/product-stub";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setLocale(locale);

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
