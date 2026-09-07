import { getTranslations } from "next-intl/server";
import { TogetherDetailLoadingSkeleton } from "../together-detail-loading-skeleton";

export default async function Loading() {
  const t = await getTranslations("together.preferences");
  return (
    <TogetherDetailLoadingSkeleton
      testId="together-preferences-loading"
      title={t("title")}
    />
  );
}
