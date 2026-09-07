import { getTranslations } from "next-intl/server";
import { TogetherDetailLoadingSkeleton } from "../together-detail-loading-skeleton";

export default async function Loading() {
  const t = await getTranslations("settings");
  return (
    <TogetherDetailLoadingSkeleton
      testId="together-settings-loading"
      title={t("title")}
      subtitle={t("subtitle")}
    />
  );
}
