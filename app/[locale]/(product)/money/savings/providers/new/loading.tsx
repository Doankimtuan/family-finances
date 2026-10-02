import { getTranslations } from "next-intl/server";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar, TopAppBarVariant } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function SavingsProviderCreateLoading() {
  const t = await getTranslations("money.savingsCatalog");
  return (
    <Page
      topBar={
        <TopAppBar
          variant={TopAppBarVariant.FORM}
          backHref={APP_PATH.MONEY_SAVINGS_PROVIDERS}
          title={t("createProvider")}
        />
      }
    >
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-80 w-full rounded-(--radius-card)" />
      <Skeleton className="h-60 w-full rounded-(--radius-card)" />
      <Skeleton className="h-24 w-full rounded-(--radius-card)" />
    </Page>
  );
}
