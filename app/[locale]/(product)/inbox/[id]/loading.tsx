import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function InboxDetailLoading() {
  const t = await getTranslations("inbox");

  return (
    <Page
      topBar={
        <TopAppBar
          variant="detail"
          title={t("detailTitle")}
          subtitle={t("detailSubtitle")}
          backHref={APP_PATH.INBOX}
          backLabel={t("backToQueue")}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <Card tone="highlighted" className="gap-(--space-3) p-(--space-4)">
        <div className="flex items-start justify-between gap-(--space-3)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-64" />
      </Card>

      <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
        <div className="flex items-start gap-(--space-3)">
          <Skeleton className="size-8 rounded-(--radius-control)" />
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </Card>

      <Card tone="soft" className="gap-(--space-2) p-(--space-4)">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
      </Card>
    </Page>
  );
}
