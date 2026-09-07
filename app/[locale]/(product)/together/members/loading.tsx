import { getTranslations } from "next-intl/server";
import { TogetherDetailLoadingSkeleton } from "../together-detail-loading-skeleton";

export default async function Loading() {
  const t = await getTranslations("together");
  return (
    <TogetherDetailLoadingSkeleton
      testId="together-members-loading"
      title={t("membersTitle")}
    />
  );
}
