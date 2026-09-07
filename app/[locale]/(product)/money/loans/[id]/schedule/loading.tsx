import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/shared/ui/skeleton";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function LoanFullScheduleLoading() {
  const t = await getTranslations("money.loanDetail");
  return (
    <Page
      testId="loan-full-schedule-loading"
      contentClassName="gap-(--space-5)"
      topBar={
        <TopAppBar
          variant="detail"
          title={t("fullScheduleTitle")}
          backHref={APP_PATH.MONEY_LOANS}
        />
      }
    >
      <div aria-busy="true" className="flex flex-col gap-(--space-4)">
        <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        <Skeleton className="h-64 w-full rounded-(--radius-card)" />
      </div>
    </Page>
  );
}
