import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

/** Mirrors the catalog header and grouped product rows. */
export default async function SavingsProvidersLoading() {
  const t = await getTranslations("money.savingsCatalog");
  return (
    <Page
      testId="money-savings-providers-loading"
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
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-10 w-28 rounded-(--radius-control)" />
        </div>
        <div className="flex flex-col gap-(--space-3)">
          <div className="flex items-center gap-(--space-3)">
            <Skeleton className="size-10 rounded-(--radius-control)" />
            <Skeleton className="h-4 w-36 rounded" />
          </div>
          <Skeleton className="h-32 w-full rounded-(--radius-card)" />
        </div>
      </div>
    </Page>
  );
}
