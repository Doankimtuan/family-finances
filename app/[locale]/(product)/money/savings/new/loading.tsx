import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

/** Mirrors the create Savings wizard: header, progress, grouped choices. */
export default async function NewSavingLoading() {
  const t = await getTranslations("money.savingsWizard");
  return (
    <Page
      testId="money-savings-new-loading"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_SAVINGS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <div className="flex flex-col gap-(--space-5)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <Skeleton className="h-28 w-full rounded-(--radius-card)" />
        <Skeleton className="h-12 w-full rounded-(--radius-control)" />
        <Skeleton className="h-36 w-full rounded-(--radius-card)" />
        <Skeleton className="h-36 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
