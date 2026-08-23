import { getLocale, getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-3)">
      <div className="rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="mt-(--space-2) h-9 w-52" />
        <div className="mt-(--space-4) flex items-center justify-between gap-(--space-3) border-t border-divider pt-(--space-3)">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4) shadow-(--elevation-1)">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-(--space-3) h-2 w-full rounded-full" />
        <div className="mt-(--space-3) grid grid-cols-2 gap-x-(--space-4) gap-y-(--space-2)">
          {[0, 1, 2, 3].map((cell) => (
            <div
              key={cell}
              className="flex items-center justify-between gap-(--space-2)"
            >
              <div className="flex items-center gap-(--space-2)">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-(--space-1)">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCardSkeleton() {
  return (
    <div className="rounded-(--radius-card) border border-border-subtle bg-surface p-0 shadow-(--elevation-1)">
      <div className="px-(--space-4) pb-(--space-1) pt-(--space-4)">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex flex-col divide-y divide-divider pb-(--space-1)">
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
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <section className="flex flex-col gap-(--space-4)">
      <div className="flex items-start justify-between gap-(--space-3)">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-20 w-full rounded-(--radius-card)" />
        <Skeleton className="h-20 w-full rounded-(--radius-card)" />
      </div>
    </section>
  );
}

/** Loading shell mirrors the Money hub: position hero → composition → accounts → module groups. */
export default async function MoneyLoading() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "money" });

  return (
    <Page
      testId="money-hub-loading"
      topBar={<TopAppBar variant="primary" title={t("title")} />}
    >
      <HeroSkeleton />
      <AccountsSkeleton />
      <ModuleCardSkeleton />
      <ModuleCardSkeleton />
    </Page>
  );
}
