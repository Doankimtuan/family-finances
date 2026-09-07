import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function TransactionTagsLoading() {
  const t = await getTranslations("money.transactionTags");

  return (
    <Page
      testId="money-transaction-tags-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={APP_PATH.MONEY_TRANSACTIONS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <Skeleton className="h-4 w-3/4" />
      <Card tone="soft" className="gap-(--space-3) p-(--space-4)" aria-hidden>
        <div className="flex flex-col items-center gap-(--space-3) py-(--space-4)">
          <Skeleton className="size-12 rounded-(--radius-control)" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
      </Card>
    </Page>
  );
}
