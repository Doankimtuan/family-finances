import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { Section } from "@/shared/patterns/section";
import { Skeleton } from "@/shared/ui/skeleton";
import { TopAppBar } from "@/shared/patterns/top-app-bar";

export default async function InvestmentsLoading() {
  const t = await getTranslations("money.investments.overview");
  return (
    <Page
      testId="money-investments-loading"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <Section variant="emphasized" contentClassName="gap-(--space-3)">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-10 w-3/4 rounded" />
        <div className="grid grid-cols-2 gap-(--space-3)">
          <Skeleton className="h-14 rounded" />
          <Skeleton className="h-14 rounded" />
          <Skeleton className="h-14 rounded" />
          <Skeleton className="h-14 rounded" />
        </div>
      </Section>
      <Section contentClassName="gap-(--space-3)">
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-24 w-full rounded" />
        <Skeleton className="h-24 w-full rounded" />
      </Section>
    </Page>
  );
}
