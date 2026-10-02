import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function AccountsLoading() {
  const t = await getTranslations("money");

  return (
    <Page
      testId="money-accounts-loading"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY}
          backLabel={t("backToMoney")}
          title={t("accountsPage.title")}
          subtitle={t("accountsPage.subtitle")}
          trailing={
            <Skeleton className="h-11 w-28 rounded-(--radius-control)" />
          }
        />
      }
    >
      <Card tone="elevated" className="gap-(--space-3) p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <div className="flex min-w-0 flex-col gap-(--space-2)">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col gap-(--space-2) border-t border-border-subtle/65 pt-(--space-3)">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-14 rounded-(--radius-card)" />
          ))}
        </div>
      </Card>
    </Page>
  );
}
