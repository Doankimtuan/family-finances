import { getLocale, getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Card } from "@/shared/patterns/card";
import { Skeleton } from "@/shared/ui/skeleton";

function HeroSkeleton() {
  return (
    <Card
      tone="elevated"
      className="gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-linear-to-br from-surface via-surface to-primary-soft/20 p-(--space-5)"
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="size-11 rounded-(--radius-control)" />
      </div>
      <Skeleton className="mt-(--space-3) h-9 w-52" />
      <Skeleton className="mt-(--space-2) h-4 w-64 max-w-full" />
      <Skeleton className="mt-(--space-4) h-(--space-2) w-full rounded-full" />
      <div className="mt-(--space-3) flex flex-wrap gap-(--space-2)">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-7 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-(--space-4) flex items-center justify-between gap-(--space-3) border-t border-border-subtle pt-(--space-3)">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  );
}

function ModuleCardSkeleton() {
  return (
    <section className="flex flex-col gap-(--space-3)">
      <div className="flex flex-col gap-(--space-1)">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex flex-col divide-y divide-border-subtle/65 py-(--space-1)">
          {[0, 1].map((row) => (
            <div
              key={row}
              className="flex min-h-14 items-center gap-(--space-3) px-(--space-4) py-(--space-2)"
            >
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-(--space-1)">
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function AccountsSkeleton() {
  return (
    <Card tone="elevated" className="gap-0 overflow-hidden p-0">
      <div className="flex min-h-16 items-center justify-between gap-(--space-3) px-(--space-4) pt-(--space-3)">
        <div className="flex min-w-0 items-center gap-(--space-3)">
          <Skeleton className="size-10 shrink-0 rounded-(--radius-control)" />
          <div className="flex min-w-0 flex-col gap-(--space-1)">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-24 shrink-0" />
      </div>
      <div className="mt-(--space-3) flex flex-col divide-y divide-border-subtle/65 border-t border-border-subtle/65">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex min-h-11 items-center gap-(--space-3) px-(--space-3) py-(--space-2)"
          >
            <Skeleton className="size-8 shrink-0 rounded-(--radius-control)" />
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="h-4 w-24 shrink-0" />
          </div>
        ))}
      </div>
      <div className="flex justify-center border-t border-border-subtle/65 px-(--space-3) py-(--space-2)">
        <Skeleton className="h-4 w-28" />
      </div>
    </Card>
  );
}

/** Loading shell follows the same grouped overview composition as Money. */
export default async function MoneyLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "money" });

  return (
    <Page
      testId="money-hub-loading"
      contentClassName="gap-(--space-4)"
      topBar={
        <TopAppBar
          variant="primary"
          title={t("title")}
          subtitle={t("header.subtitle")}
        />
      }
    >
      <HeroSkeleton />
      <AccountsSkeleton />
      <ModuleCardSkeleton />
      <ModuleCardSkeleton />
      <Card tone="elevated" className="gap-0 p-0">
        <div className="flex items-center gap-(--space-3) p-(--space-4)">
          <Skeleton className="size-10 shrink-0 rounded-(--radius-control)" />
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      </Card>
    </Page>
  );
}
