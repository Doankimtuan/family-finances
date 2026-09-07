import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

/** Mirrors the create investment wizard chrome while the page loads. */
export default async function NewInvestmentLoading() {
  const t = await getTranslations("money.investments.opening");
  return (
    <Page
      testId="money-investments-new-loading"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_INVESTMENTS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <div className="flex flex-col gap-(--space-4)">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-16 w-full rounded-(--radius-card)" />
        <Skeleton className="h-16 w-full rounded-(--radius-card)" />
        <Skeleton className="h-16 w-full rounded-(--radius-card)" />
        <Skeleton className="h-24 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
