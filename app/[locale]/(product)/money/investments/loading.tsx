import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function InvestmentsLoading() {
  const t = await getTranslations("money.investments.stitchOverview");
  return (
    <Page
      testId="money-investments-loading"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("title")}
          backHref={APP_PATH.MONEY}
        />
      }
    >
      <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
      </Card>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-28 w-full rounded-(--radius-card)" />
      <Skeleton className="h-28 w-full rounded-(--radius-card)" />
    </Page>
  );
}
