import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card } from "@/shared/patterns/card";

export default async function InboxLoading() {
  const t = await getTranslations("inbox");

  return (
    <Page
      topBar={
        <TopAppBar
          variant="contextual"
          eyebrow={t("header.eyebrow")}
          title={t("title")}
          meta={<Skeleton className="h-4 w-20" />}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <Card tone="soft" className="gap-(--space-2) p-(--space-4)">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </Card>

      <div className="flex gap-(--space-2)">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
      </div>

      <Card tone="soft" className="gap-(--space-3) p-(--space-3)">
        <div className="flex items-center gap-(--space-2)">
          <Skeleton className="size-8 rounded-(--radius-control)" />
          <Skeleton className="h-10 flex-1 rounded-(--radius-control)" />
        </div>
        <div className="flex gap-(--space-2) overflow-hidden border-t border-divider pt-(--space-3)">
          {[0, 1, 2, 3].map((chip) => (
            <Skeleton key={chip} className="h-9 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </Card>

      <section className="flex flex-col gap-(--space-3)">
        <div className="flex flex-col gap-(--space-2)">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col gap-(--space-2)">
          <Card tone="default" className="gap-(--space-3) p-(--space-3)">
            <div className="flex items-start gap-(--space-3)">
              <Skeleton className="size-8 rounded-(--radius-control)" />
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center justify-between gap-(--space-3)">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </Card>
          <Card tone="default" className="gap-(--space-3) p-(--space-3)">
            <div className="flex items-start gap-(--space-3)">
              <Skeleton className="size-8 rounded-(--radius-control)" />
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center justify-between gap-(--space-3)">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </Card>
        </div>
      </section>
    </Page>
  );
}
