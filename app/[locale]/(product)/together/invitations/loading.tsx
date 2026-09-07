import { getTranslations } from "next-intl/server";
import { TogetherDetailLoadingSkeleton } from "../together-detail-loading-skeleton";

export default async function Loading() {
  const t = await getTranslations("together.invitations");
  return (
    <TogetherDetailLoadingSkeleton
      testId="together-invitations-loading"
      title={t("title")}
      subtitle={t("subtitle")}
    />
  );
}
