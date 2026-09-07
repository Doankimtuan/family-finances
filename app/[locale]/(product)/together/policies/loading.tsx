import { getTranslations } from "next-intl/server";
import { TogetherDetailLoadingSkeleton } from "../together-detail-loading-skeleton";

export default async function Loading() {
  const t = await getTranslations("together.policies");
  return (
    <TogetherDetailLoadingSkeleton
      testId="together-policies-loading"
      title={t("title")}
    />
  );
}
