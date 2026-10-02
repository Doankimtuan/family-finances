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
        />
      }
    >
      <div className="flex flex-col gap-(--space-5)">
        <Skeleton className="h-40 w-full rounded-(--radius-card)" />
        {[0, 1, 2].map((group) => (
          <div key={group} className="flex flex-col gap-(--space-2)">
            <Skeleton className="h-3 w-40 rounded-(--radius-sm)" />
            <div className="overflow-hidden rounded-(--radius-card) border border-border-subtle bg-surface">
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-(--space-3) border-b border-divider p-(--space-3)"
                >
                  <Skeleton className="size-8 rounded-(--radius-control)" />
                  <div className="flex flex-1 flex-col gap-(--space-2)">
                    <Skeleton className="h-3 w-32 rounded-(--radius-sm)" />
                    <Skeleton className="h-3 w-24 rounded-(--radius-sm)" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded-(--radius-sm)" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
      </div>
    </Page>
  );
}
